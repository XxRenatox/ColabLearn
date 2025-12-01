const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/database');
const { 
  asyncHandler, 
  createValidationError,
  AppError,
  createNotFoundError 
} = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/calendar/events
// @desc    Obtener eventos del calendario del usuario
// @access  Private
router.get('/events', [
  query('start_date').optional().isISO8601().withMessage('Fecha de inicio inválida'),
  query('end_date').optional().isISO8601().withMessage('Fecha de fin inválida'),
  query('event_type').optional().isIn(['session', 'exam', 'assignment', 'reminder', 'deadline']).withMessage('Tipo de evento inválido'),
  query('group_id').optional().isUUID().withMessage('ID de grupo inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros de consulta inválidos', errors.array());
  }

  const { start_date, end_date, event_type, group_id } = req.query;
  const userId = req.user.id;

  let query = supabase
    .from('calendar_events')
    .select(`
      *,
      sessions:session_id (
        id, title, duration, location_type, location_details, max_attendees,
        groups:group_id (id, name, color, subject)
      ),
      groups:group_id (id, name, color, subject)
    `)
    .eq('user_id', userId)
    .order('start_date', { ascending: true });

  // Filtros
  if (start_date) {
    query = query.gte('start_date', start_date);
  }
  if (end_date) {
    query = query.lte('end_date', end_date);
  }
  if (event_type) {
    query = query.eq('event_type', event_type);
  }
  if (group_id) {
    query = query.eq('group_id', group_id);
  }

  const { data: events, error } = await query;

  if (error) {
    throw new AppError('Error obteniendo eventos: ' + error.message, 500);
  }

  res.json({
    success: true,
    data: {
      events,
      count: events.length
    }
  });
}));

// @route   GET /api/calendar/events/:id
// @desc    Obtener evento específico
// @access  Private
router.get('/events/:id', asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  const { data: event, error } = await supabase
    .from('calendar_events')
    .select(`
      *,
      sessions:session_id (
        id, title, description, duration, location_type, location_details, 
        max_attendees, status, agenda, resources,
        groups:group_id (id, name, color, subject),
        organizer:organizer_id (id, name, avatar)
      ),
      groups:group_id (id, name, color, subject)
    `)
    .eq('id', eventId)
    .eq('user_id', userId)
    .single();

  if (error || !event) {
    throw createNotFoundError('Evento no encontrado');
  }

  res.json({
    success: true,
    data: { event }
  });
}));

// @route   POST /api/calendar/events
// @desc    Crear nuevo evento de calendario
// @access  Private
router.post('/events', [
  // Validar título
  body('title')
    .trim()
    .notEmpty().withMessage('El título es requerido')
    .isLength({ max: 200 }).withMessage('El título no puede tener más de 200 caracteres'),
    
  // Validar descripción (opcional)
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede tener más de 1000 caracteres'),
    
  // Validar tipo de evento
  body('event_type')
    .isIn(['session', 'exam', 'assignment', 'reminder', 'deadline'])
    .withMessage('Tipo de evento inválido. Debe ser uno de: session, exam, assignment, reminder, deadline'),
    
  // Validar fechas
  body('start_date')
    .notEmpty().withMessage('La fecha de inicio es requerida')
    .isISO8601().withMessage('Formato de fecha de inicio inválido. Use el formato YYYY-MM-DDTHH:mm:ss.sssZ')
    .custom((value, { req }) => {
      const startDate = new Date(value);
      const endDate = new Date(req.body.end_date);
      
      if (startDate >= endDate) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
      }
      return true;
    }),
    
  body('end_date')
    .notEmpty().withMessage('La fecha de fin es requerida')
    .isISO8601().withMessage('Formato de fecha de fin inválido. Use el formato YYYY-MM-DDTHH:mm:ss.sssZ'),
    
  // Validar prioridad (opcional)
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('La prioridad debe ser: low, medium o high'),
    
  // Validar group_id (opcional)
  body('group_id')
    .optional({ checkFalsy: true })
    .isUUID().withMessage('El ID de grupo no es válido')
], asyncHandler(async (req, res) => {
  // Validar los datos de la petición
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value,
      type: err.type || 'validation'
    }));
    
    // Verificar si hay errores de validación de fechas
    const dateErrors = errors.array().filter(err => 
      err.path === 'start_date' || err.path === 'end_date'
    );
    
    return res.status(400).json({
      success: false,
      message: 'Error de validación en los datos del evento',
      errors: errorMessages,
      receivedData: {
        title: req.body.title,
        event_type: req.body.event_type,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        group_id: req.body.group_id
      }
    });
  }

  const {
    title,
    description,
    event_type,
    start_date,
    end_date,
    all_day = false,
    priority = 'medium',
    color = 'bg-blue-500',
    location,
    group_id,
    session_id,
    is_recurring = false,
    recurrence_rule
  } = req.body;

  // Asegurarnos de que el user_id esté disponible
  if (!req.user || !req.user.id) {
    throw new AppError('No se pudo autenticar al usuario', 401);
  }
  
  const userId = req.user.id;

  // Validar fechas
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  if (all_day) {
    // Para eventos de todo el día, permitir fechas iguales
    if (endDate < startDate) {
      throw createValidationError('La fecha de fin debe ser igual o posterior a la fecha de inicio para eventos de todo el día');
    }
  } else {
    // Para eventos con hora específica, requerir que la fecha de fin sea posterior
    if (endDate <= startDate) {
      throw createValidationError('La fecha de fin debe ser posterior a la fecha de inicio');
    }
  }

  // Verificar que el grupo pertenece al usuario si se especifica
  if (group_id) {
    const { data: groupMember, error: memberError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group_id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (memberError || !groupMember) {
      throw new AppError('No perteneces a este grupo', 403);
    }
  }

  // Crear objeto de evento
  const newEvent = {
    user_id: userId,
    title: title.trim(),
    description: description ? description.trim() : null,
    event_type,
    start_date,
    end_date,
    all_day,
    priority,
    color,
    location: location || null,
    group_id: group_id || null,
    session_id: session_id || null,
    is_recurring,
    recurrence_rule: recurrence_rule || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    // Usar el cliente de Supabase autenticado del request si está disponible
    const client = req.supabase || supabase;
    
    const { data: event, error } = await client
      .from('calendar_events')
      .insert([newEvent])
      .select()
      .single();

    if (error) {
      // Verificar si es un error de RLS (Row Level Security)
      if (error.code === '42501') {
        throw new AppError('No tienes permisos para crear este evento', 403);
      }
      
      // Verificar si es un error de restricción de clave foránea
      if (error.code === '23503') {
        throw new AppError('Error de referencia: El grupo o sesión especificada no existe', 400);
      }
      
      throw new AppError('Error al crear el evento: ' + (error.details || error.message), 500);
    }
    
    if (!event) {
      throw new AppError('No se pudo crear el evento: respuesta inesperada del servidor', 500);
    }
    
    // Enviar respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: { event }
    });
    
  } catch (error) {
    throw error; // El error será manejado por el middleware de errores
  }
}));

// @route   PUT /api/calendar/events/:id
// @desc    Actualizar evento
// @access  Private
router.put('/events/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Título inválido (máximo 200 caracteres)'),
  body('event_type').optional().isIn(['session', 'exam', 'assignment', 'reminder', 'deadline']).withMessage('Tipo de evento inválido'),
  body('start_date').optional().isISO8601().withMessage('Fecha de inicio inválida'),
  body('end_date').optional().isISO8601().withMessage('Fecha de fin inválida'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Prioridad inválida')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos de actualización inválidos', errors.array());
  }

  const eventId = req.params.id;
  const userId = req.user.id;

  // Verificar que el evento pertenece al usuario
  const { data: existingEvent, error: checkError } = await supabase
    .from('calendar_events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .single();

  if (checkError || !existingEvent) {
    throw createNotFoundError('Evento no encontrado');
  }

  const updateData = { ...req.body };
  delete updateData.user_id; // No permitir cambiar el propietario

  // Validar fechas si se proporcionan ambas
  if (updateData.start_date && updateData.end_date) {
    const startDate = new Date(updateData.start_date);
    const endDate = new Date(updateData.end_date);

    if (endDate <= startDate) {
      throw createValidationError('La fecha de fin debe ser posterior a la fecha de inicio');
    }
  }

  const { data: event, error } = await supabase
    .from('calendar_events')
    .update(updateData)
    .eq('id', eventId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new AppError('Error actualizando evento: ' + error.message, 500);
  }

  res.json({
    success: true,
    message: 'Evento actualizado exitosamente',
    data: { event }
  });
  
}));

// @route   DELETE /api/calendar/events/:id
// @desc    Eliminar evento
// @access  Private
router.delete('/events/:id', asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', userId);

  if (error) {
    throw new AppError('Error eliminando evento: ' + error.message, 500);
  }

  res.json({
    success: true,
    message: 'Evento eliminado exitosamente'
  });
}));

// @route   GET /api/calendar/month/:year/:month
// @desc    Obtener eventos de un mes específico
// @access  Private
router.get('/month/:year/:month', asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  const userId = req.user.id;

  // Validar parámetros
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    throw createValidationError('Año y mes deben ser números válidos');
  }

  // Calcular fechas de inicio y fin del mes
  const startDate = new Date(yearNum, monthNum - 1, 1).toISOString();
  const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59).toISOString();

  const { data: events, error } = await supabaseAdmin
    .from('calendar_events')
    .select(`
      *,
      sessions:session_id (
        id, title, duration, location_type, location_details,
        groups:group_id (id, name, color, subject)
      ),
      groups:group_id (id, name, color, subject)
    `)
    .eq('user_id', userId)
    .gte('start_date', startDate)
    .lte('start_date', endDate)
    .order('start_date', { ascending: true });

  if (error) {
    throw new AppError('Error obteniendo eventos del mes: ' + error.message, 500);
  }

  res.json({
    success: true,
    data: {
      events,
      month: monthNum,
      year: yearNum,
      count: events.length
    }
  });
}));

module.exports = router;