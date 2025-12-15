const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { supabase, supabaseAdmin, createAuthenticatedClient } = require('../config/database');
const {
  asyncHandler,
  AppError,
  createValidationError,
  createNotFoundError,
  createForbiddenError
} = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/sessions
// @desc    Obtener sesiones de estudio del usuario
// @access  Private
router.get('/', [
  query('group_id').optional().isUUID().withMessage('ID de grupo inválido'),
  query('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed']).withMessage('Estado inválido'),
  query('type').optional().isIn(['study', 'review', 'exam_prep', 'project', 'discussion', 'tutoring']).withMessage('Tipo inválido'),
  query('user_groups').optional().isBoolean().withMessage('user_groups debe ser booleano'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros de consulta inválidos', errors.array());
  }

  const { group_id, status, type, user_groups, limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;

  const includeUserGroups =
    typeof user_groups === 'string'
      ? user_groups.toLowerCase() === 'true'
      : Boolean(user_groups);

  let query;

  if (includeUserGroups) {
    // Usar consulta directa con RLS - los usuarios solo verán sesiones de grupos donde son miembros activos
    query = supabase
      .from('sessions')
      .select(`
        *,
        groups:group_id (
          id, name, color, subject, university, career, semester
        ),
        organizer:organizer_id (
          id, name, avatar, university, career
        ),
        session_attendance:session_attendance (
          status
        )
      `)
      .order('scheduled_date', { ascending: false })
      .range(offset, offset + limit - 1);
  } else {
    // Consulta original: solo sesiones donde el usuario está registrado
    query = supabaseAdmin
      .from('sessions')
      .select(`
        *,
        groups:group_id (
          id, name, color, subject, university, career, semester
        ),
        organizer:organizer_id (
          id, name, avatar, university, career
        ),
        session_attendance!inner (
          user_id, status, joined_at, left_at, actual_duration
        )
      `)
      .eq('session_attendance.user_id', userId)
      .order('scheduled_date', { ascending: false })
      .range(offset, offset + limit - 1);
  }

  // Filtros adicionales
  if (group_id) {
    query = query.eq('group_id', group_id);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (type) {
    query = query.eq('type', type);
  }

  const { data: sessions, error } = await query;

  if (error) {
    throw new AppError('Error obteniendo sesiones: ' + error.message, 500);
  }

  const now = new Date();
  const autoCompletedSessions = [];

  const sessionsToProcess = Array.isArray(sessions) ? sessions : [];

  await Promise.all(
    sessionsToProcess.map(async (session) => {
      const scheduledDate = session?.scheduled_date ? new Date(session.scheduled_date) : null;
      const duration = Number.isFinite(session?.duration) ? Number(session.duration) : null;

      if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
        return;
      }

      const sessionEnd = new Date(scheduledDate);
      if (duration && duration > 0) {
        sessionEnd.setMinutes(sessionEnd.getMinutes() + duration);
      }

      const hasEnded = sessionEnd.getTime() < now.getTime();

      if (hasEnded && session.status !== 'completed' && session.status !== 'cancelled') {
        try {
          const { error: updateError } = await supabaseAdmin
            .from('sessions')
            .update({
              status: 'completed',
              actual_end_time: session.actual_end_time || new Date().toISOString(),
              actual_start_time: session.actual_start_time || session.scheduled_date,
            })
            .eq('id', session.id);

          if (!updateError) {
            autoCompletedSessions.push(session.id);
            session.status = 'completed';
            session.actual_end_time = session.actual_end_time || new Date().toISOString();
            session.actual_start_time = session.actual_start_time || session.scheduled_date;
          }
        } catch {
          // Ignorar errores individuales para no bloquear la respuesta
        }
      }
    })
  );

  // Para user_groups, formatear el conteo de asistentes
  let formattedSessions = sessionsToProcess;
  if (includeUserGroups) {
    formattedSessions = sessionsToProcess?.map(session => {
      const attendeeCount = session.session_attendance?.filter(att => att.status === 'confirmed').length || 0;
      return {
        ...session,
        attendee_count: attendeeCount
      };
    }) || [];
  }

  res.json({
    success: true,
    data: {
      sessions: formattedSessions,
      count: formattedSessions.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      autoCompletedSessions
    }
  });
}));

// @route   GET /api/sessions/:id
// @desc    Obtener sesión específica
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;

  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .select(`
      *,
      groups:group_id (
        id, name, color, subject, university, career, semester, description
      ),
      organizer:organizer_id (
        id, name, avatar, university, career, level, xp
      ),
      session_attendance (
        user_id, status, joined_at, left_at, actual_duration,
        users:user_id (id, name, avatar, university, career)
      )
    `)
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    throw createNotFoundError('No se encontró la sesión. Verifica que el ID sea correcto y que tengas acceso al grupo.');
  }

  // Verificar que el usuario es miembro del grupo o organizador
  const { data: groupMember, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('id')
    .eq('group_id', session.group_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (memberError || !groupMember) {
    throw createForbiddenError('No tienes acceso a esta sesión. Debes ser miembro del grupo para ver sus sesiones.');
  }

  res.json({
    success: true,
    data: { session }
  });
}));

// @route   POST /api/sessions
// @desc    Crear nueva sesión de estudio
// @access  Private
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('El título de la sesión es requerido y debe tener entre 1 y 200 caracteres'),
  body('group_id').isUUID().withMessage('Debes seleccionar un grupo válido para la sesión'),
  body('scheduled_date')
    .notEmpty().withMessage('Fecha programada requerida')
    .custom((value) => {
      try {
        // Validar que sea un formato de fecha válido
        // Aceptamos cualquier formato que JavaScript pueda parsear
        if (!value || typeof value !== 'string') {
          throw new Error('Por favor, ingresa una fecha y hora válidas');
        }

        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('La fecha y hora ingresadas no son válidas. Por favor, verifica el formato');
        }

        // Validar que tenga el formato básico esperado (debe contener T)
        if (!value.includes('T')) {
          throw new Error('El formato de fecha no es correcto. Por favor, selecciona una fecha y hora válidas');
        }

        return true;
      } catch (error) {
        throw new Error(error.message || 'Por favor, ingresa una fecha y hora válidas para la sesión');
      }
    })
    .withMessage('Por favor, ingresa una fecha y hora válidas para la sesión'),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('La duración debe estar entre 15 y 480 minutos (8 horas máximo)'),
  body('type').optional().isIn(['study', 'review', 'exam_prep', 'project', 'discussion', 'tutoring']).withMessage('El tipo de sesión seleccionado no es válido'),
  body('location_type').optional().isIn(['virtual', 'physical']).withMessage('Debes seleccionar un tipo de ubicación válido (virtual o presencial)'),
  body('max_attendees').optional().isInt({ min: 2, max: 100 }).withMessage('El número máximo de asistentes debe estar entre 2 y 100 personas')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log detallado de errores para debugging


    throw createValidationError('Por favor, verifica que todos los campos estén completos correctamente', errors.array());
  }

  const {
    title,
    description,
    group_id,
    scheduled_date,
    duration,
    type = 'study',
    location_type = 'virtual',
    location_details,
    location_room,
    platform,
    max_attendees = 20,
    agenda = [],
    resources = []
  } = req.body;

  const userId = req.user.id;

  // Verificar que el usuario es admin o moderator del grupo
  const { data: groupMember, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('role')
    .eq('group_id', group_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (memberError || !groupMember) {
    throw createForbiddenError('No tienes acceso a este grupo. Asegúrate de ser miembro del grupo antes de crear una sesión.');
  }

  // Verificar que tenga permisos para crear sesiones (admin o moderator)
  if (!['admin', 'moderator'].includes(groupMember.role)) {
    throw createForbiddenError('Solo los administradores y moderadores del grupo pueden crear sesiones. Contacta a un administrador si necesitas crear una sesión.');
  }

  // Verificar que la fecha no sea en el pasado
  // La fecha viene del frontend tratada como UTC (sin conversión de zona horaria)
  // Ejemplo: si el usuario selecciona "2025-11-30T08:43", se envía como "2025-11-30T08:43:00.000Z"
  // Esta fecha se interpreta como UTC, pero representa la hora local del usuario
  const sessionDate = new Date(scheduled_date);
  const now = new Date();

  // Validar que la fecha sea válida
  if (isNaN(sessionDate.getTime())) {
    throw createValidationError('La fecha seleccionada no es válida. Por favor, verifica que hayas ingresado una fecha y hora correctas.');
  }

  // Verificar que la fecha no sea en el pasado
  // IMPORTANTE: La fecha viene del frontend tratada como UTC pero representa hora local del usuario
  // Por lo tanto, validamos con márgenes flexibles para compensar diferencias de zona horaria

  // Mínimo: debe ser al menos 4 horas en el futuro
  const minMargin = 4 * 60 * 60 * 1000; // 4 horas mínimo
  const minAllowedDate = new Date(now.getTime() + minMargin);

  // Validar que la fecha esté al menos 4 horas en el futuro
  if (sessionDate.getTime() <= minAllowedDate.getTime()) {
    const diffMinutes = Math.round((minAllowedDate.getTime() - sessionDate.getTime()) / (60 * 1000));
    throw createValidationError(`Por favor, programa la sesión con al menos 4 horas de anticipación. La fecha seleccionada está muy cerca del momento actual.`);
  }

  // Crear sesión
  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .insert([{
      title,
      description,
      group_id,
      organizer_id: userId,
      type,
      scheduled_date,
      duration,
      location_type,
      location_details: location_details || (location_type === 'virtual' ? 'Enlace de videollamada' : 'Ubicación física'),
      location_room,
      platform,
      max_attendees,
      agenda,
      resources
    }])
    .select()
    .single();

  if (error) {
    throw new AppError('Error creando sesión: ' + error.message, 500);
  }

  // Crear asistencia automática para el organizador
  await supabaseAdmin
    .from('session_attendance')
    .insert([{
      session_id: session.id,
      user_id: userId,
      status: 'confirmed'
    }]);

  res.status(201).json({
    success: true,
    message: 'Sesión creada exitosamente',
    data: { session }
  });
}));



// @route   PUT /api/sessions/:id
// @desc    Actualizar sesión
// @access  Private
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('El título de la sesión es requerido y debe tener entre 1 y 200 caracteres'),
  body('duration').optional().isInt({ min: 15, max: 480 }).withMessage('La duración debe estar entre 15 y 480 minutos (8 horas máximo)'),
  body('type').optional().isIn(['study', 'review', 'exam_prep', 'project', 'discussion', 'tutoring']).withMessage('El tipo de sesión seleccionado no es válido'),
  body('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed']).withMessage('El estado seleccionado no es válido'),
  body('scheduled_date').optional().custom((value) => {
    if (!value) return true;
    try {
      if (typeof value !== 'string') {
        throw new Error('Por favor, ingresa una fecha y hora válidas');
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('La fecha y hora ingresadas no son válidas. Por favor, verifica el formato');
      }
      if (!value.includes('T')) {
        throw new Error('El formato de fecha no es correcto. Por favor, selecciona una fecha y hora válidas');
      }
      return true;
    } catch (error) {
      throw new Error(error.message || 'Por favor, ingresa una fecha y hora válidas para la sesión');
    }
  }),
  body('location_type').optional().isIn(['virtual', 'physical']).withMessage('Debes seleccionar un tipo de ubicación válido (virtual o presencial)'),
  body('max_attendees').optional().isInt({ min: 2, max: 100 }).withMessage('El número máximo de asistentes debe estar entre 2 y 100 personas'),
  body('agenda').optional().isArray().withMessage('La agenda debe ser un array'),
  body('resources').optional().isArray().withMessage('Los recursos deben ser un array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Por favor, verifica que los datos de actualización sean correctos', errors.array());
  }

  const sessionId = req.params.id;
  const userId = req.user.id;

  // Verificar que la sesión existe y el usuario es el organizador
  const { data: existingSession, error: checkError } = await supabaseAdmin
    .from('sessions')
    .select('id, organizer_id, status, scheduled_date, group_id')
    .eq('id', sessionId)
    .single();

  if (checkError || !existingSession) {
    throw createNotFoundError('No se pudo encontrar la sesión solicitada');
  }

  if (existingSession.organizer_id !== userId) {
    throw createForbiddenError('Solo el organizador de la sesión puede actualizarla. Si necesitas hacer cambios, contacta al organizador.');
  }

  // Validar que solo se pueda editar antes de 1 hora de que empiece la sesión
  if (existingSession.status === 'scheduled' && existingSession.scheduled_date) {
    const sessionDate = new Date(existingSession.scheduled_date);
    const now = new Date();
    const oneHourBefore = new Date(sessionDate.getTime() - (60 * 60 * 1000)); // 1 hora antes

    if (now >= oneHourBefore) {
      throw createValidationError('No puedes editar esta sesión. Solo puedes hacer cambios hasta 1 hora antes de que comience la sesión.');
    }
  }

  // Si la sesión ya comenzó o está en progreso, no permitir cambios en fecha/hora
  if (['in_progress', 'completed'].includes(existingSession.status)) {
    if (req.body.scheduled_date) {
      throw createValidationError('No puedes cambiar la fecha de una sesión que ya comenzó o finalizó.');
    }
  }

  const updateData = { ...req.body };
  delete updateData.group_id; // No permitir cambiar el grupo
  delete updateData.organizer_id; // No permitir cambiar el organizador

  // Si se está iniciando la sesión, actualizar timestamps
  if (updateData.status === 'in_progress' && existingSession.status === 'scheduled') {
    updateData.actual_start_time = new Date().toISOString();
  }

  // Si se está completando la sesión, actualizar timestamps
  if (updateData.status === 'completed' && existingSession.status === 'in_progress') {
    updateData.actual_end_time = new Date().toISOString();
  }

  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new AppError('Error actualizando sesión: ' + error.message, 500);
  }

  // Emit socket event for notes updates
  if (updateData.session_notes) {
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${sessionId}`).emit('sessionNotesUpdated', {
        sessionId,
        notes: typeof updateData.session_notes === 'object'
          ? updateData.session_notes.notes
          : updateData.session_notes
      });
    }
  }

  // Obtener miembros del grupo y asistentes de la sesión para enviar notificaciones
  const [groupMembersResult, sessionAttendeesResult] = await Promise.all([
    supabaseAdmin
      .from('group_members')
      .select('user_id')
      .eq('group_id', existingSession.group_id)
      .eq('status', 'active')
      .neq('user_id', userId), // Excluir al organizador
    supabaseAdmin
      .from('session_attendance')
      .select('user_id')
      .eq('session_id', sessionId)
      .neq('user_id', userId) // Excluir al organizador
  ]);

  const groupMembers = groupMembersResult.data || [];
  const sessionAttendees = sessionAttendeesResult.data || [];

  // Combinar IDs únicos de miembros y asistentes
  const userIdsToNotify = new Set([
    ...groupMembers.map(m => m.user_id),
    ...sessionAttendees.map(a => a.user_id)
  ]);

  // Enviar notificaciones en tiempo real
  const io = req.app.get('io');
  if (io) {
    const notification = {
      type: 'session_updated',
      title: 'Sesión actualizada',
      message: `La sesión "${session.title}" ha sido actualizada`,
      session_id: sessionId,
      group_id: existingSession.group_id,
      timestamp: new Date().toISOString()
    };

    // Enviar notificación a cada usuario
    userIdsToNotify.forEach(userId => {
      io.to(`user:${userId}`).emit('notification', notification);
    });

    // También enviar actualización al grupo
    io.to(`group:${existingSession.group_id}`).emit('session-update', {
      sessionId,
      session,
      updatedBy: userId
    });
  }

  res.json({
    success: true,
    message: 'Sesión actualizada exitosamente',
    data: { session }
  });
}));

// @route   DELETE /api/sessions/:id
// @desc    Eliminar sesión
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;

  // Verificar que la sesión existe y el usuario es el organizador
  const { data: existingSession, error: checkError } = await supabaseAdmin
    .from('sessions')
    .select('id, organizer_id, status')
    .eq('id', sessionId)
    .single();

  if (checkError || !existingSession) {
    throw createNotFoundError('No se pudo encontrar la sesión solicitada');
  }

  if (existingSession.organizer_id !== userId) {
    throw createForbiddenError('Solo el organizador de la sesión puede eliminarla. Si necesitas eliminar esta sesión, contacta al organizador.');
  }

  // No permitir eliminar sesiones en progreso
  if (existingSession.status === 'in_progress') {
    throw createValidationError('No se puede eliminar una sesión que está en progreso. Espera a que termine o cancélala primero.');
  }

  const { error } = await supabaseAdmin
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    throw new AppError('Error eliminando sesión: ' + error.message, 500);
  }

  res.json({
    success: true,
    message: 'Sesión eliminada exitosamente'
  });
}));

// @route   POST /api/sessions/:id/join
// @desc    Unirse a una sesión
// @access  Private
router.post('/:id/join', asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;
  const now = new Date();

  // Verificar que la sesión existe
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('id, group_id, max_attendees, status, scheduled_date, duration, organizer_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw createNotFoundError('No se pudo encontrar la sesión solicitada');
  }

  // Validar que la sesión esté en estado válido para unirse
  if (!['scheduled', 'in_progress'].includes(session.status)) {
    throw createValidationError('No puedes unirte a esta sesión en su estado actual. Verifica el estado de la sesión e intenta nuevamente.');
  }

  const sessionStartTime = new Date(session.scheduled_date);
  const joinWindowStart = new Date(sessionStartTime);
  joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 90); // Permitir unirse 90 min antes

  if (now < joinWindowStart) {
    const diffMinutes = Math.ceil((sessionStartTime.getTime() - now.getTime()) / (1000 * 60));
    throw createValidationError(`La sesión aún no ha comenzado. Podrás unirte aproximadamente ${diffMinutes} minuto(s) antes de que inicie.`);
  }

  const sessionEndTime = new Date(sessionStartTime);
  sessionEndTime.setMinutes(sessionEndTime.getMinutes() + (session.duration || 120) + 60); // margen de 60 minutos tras finalizar

  if (now > sessionEndTime) {
    throw createValidationError('Esta sesión ya ha finalizado. No puedes unirte a sesiones que ya han terminado.');
  }

  // Verificar que el usuario no sea el organizador (ya está automáticamente registrado)
  if (session.organizer_id === userId) {
    throw createValidationError('Como organizador de esta sesión, ya estás registrado automáticamente. No necesitas unirte manualmente.');
  }

  // Verificar que el usuario ya no esté registrado
  const { data: existingAttendance, error: attendanceCheckError } = await supabaseAdmin
    .from('session_attendance')
    .select('id, status')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (attendanceCheckError && attendanceCheckError.code !== 'PGRST116') { // PGRST116 = no rows found
    throw new AppError('Error verificando asistencia existente: ' + attendanceCheckError.message, 500);
  }

  if (existingAttendance) {
    if (existingAttendance.status === 'confirmed') {
      throw createValidationError('Ya estás registrado en esta sesión. No es necesario volver a unirte.');
    } else if (existingAttendance.status === 'declined') {
      // Permitir volver a unirse si había declinado
    }
  }

  // Verificar que la sesión no esté llena
  const { data: attendance, error: attendanceError } = await supabaseAdmin
    .from('session_attendance')
    .select('id')
    .eq('session_id', sessionId)
    .eq('status', 'confirmed');

  if (attendanceError) {
    throw new AppError('Error verificando asistencia: ' + attendanceError.message, 500);
  }

  if (attendance.length >= session.max_attendees) {
    throw createValidationError('Lo sentimos, esta sesión ya alcanzó el número máximo de participantes. Intenta unirte a otra sesión o contacta al organizador.');
  }

  // Verificar que el usuario es miembro activo del grupo
  const { data: groupMember, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('id, role')
    .eq('group_id', session.group_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (memberError || !groupMember) {
    throw createForbiddenError('No tienes acceso a esta sesión. Asegúrate de ser miembro activo del grupo al que pertenece la sesión.');
  }

  // Crear o actualizar asistencia
  const { data: attendanceData, error: joinError } = await supabaseAdmin
    .from('session_attendance')
    .upsert([{
      session_id: sessionId,
      user_id: userId,
      status: 'confirmed',
      joined_at: now.toISOString()
    }], {
      onConflict: 'session_id,user_id'
    })
    .select()
    .single();

  if (joinError) {
    throw new AppError('Error uniéndose a la sesión: ' + joinError.message, 500);
  }

  res.json({
    success: true,
    message: 'Te has unido a la sesión exitosamente',
    data: {
      attendance: attendanceData,
      session_status: session.status,
      can_start: false // El frontend decidirá si mostrar botón de iniciar
    }
  });
}));

// @route   POST /api/sessions/:id/leave
// @desc    Salir de una sesión
// @access  Private
router.post('/:id/leave', asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;
  const now = new Date();

  // Verificar que la sesión existe
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('id, status, organizer_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw createNotFoundError('No se pudo encontrar la sesión solicitada');
  }

  // Verificar que el usuario esté registrado en la sesión
  const { data: attendance, error: attendanceError } = await supabaseAdmin
    .from('session_attendance')
    .select('id, status')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (attendanceError || !attendance) {
    throw createNotFoundError('No estás registrado en esta sesión. Asegúrate de haberte unido antes de intentar salir.');
  }

  if (attendance.status !== 'confirmed') {
    throw createValidationError('No puedes salir de una sesión en la que no estás confirmado. Verifica tu estado de asistencia.');
  }

  // No permitir que el organizador salga de su propia sesión
  if (session.organizer_id === userId) {
    throw createValidationError('Como organizador de esta sesión, no puedes salir de ella. Si necesitas cancelar la sesión, puedes hacerlo desde las opciones de edición.');
  }

  // Actualizar asistencia para marcar salida
  const { data: updatedAttendance, error: updateError } = await supabaseAdmin
    .from('session_attendance')
    .update({
      status: 'left',
      left_at: now.toISOString(),
      actual_duration: 0 // TODO: Calcular duración real si es necesario
    })
    .eq('id', attendance.id)
    .select()
    .single();

  if (updateError) {
    throw new AppError('Error saliendo de la sesión: ' + updateError.message, 500);
  }

  res.json({
    success: true,
    message: 'Has salido de la sesión exitosamente',
    data: {
      attendance: updatedAttendance
    }
  });
}));

// @route   POST /api/sessions/:id/feedback
// @desc    Enviar feedback de una sesión
// @access  Private
router.post('/:id/feedback', asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;
  const { rating, comment, session_type, duration, session_notes } = req.body;

  // Validar que la sesión existe
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('id, status')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw createNotFoundError('No se pudo encontrar la sesión solicitada');
  }

  // Verificar que el usuario participó en la sesión
  const { data: attendance, error: attendanceError } = await supabaseAdmin
    .from('session_attendance')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (attendanceError || !attendance) {
    throw createForbiddenError('Solo los participantes pueden enviar feedback');
  }

  // Crear feedback
  const { data: feedback, error } = await supabaseAdmin
    .from('session_feedback')
    .insert([{
      session_id: sessionId,
      user_id: userId,
      rating: parseInt(rating),
      comment: comment || null,
      session_type,
      duration: parseInt(duration)
    }])
    .select()
    .single();

  if (error) {
    throw new AppError('Error guardando feedback: ' + error.message, 500);
  }

  // Nuevo: guardar notas compartidas
  if (session_notes && session_notes.trim().length > 0) {
    const { error: notesError } = await supabaseAdmin
      .from('sessions')
      .update({
        session_notes: {
          notes: session_notes.trim(),
          created_by: userId,
          created_at: new Date().toISOString()
        }
      })
      .eq('id', sessionId);

    if (notesError) {
      // Error guardando notas
    }
  }

  res.status(201).json({
    success: true,
    message: 'Feedback y notas guardados correctamente',
    data: { feedback }
  });
}));

// @route   GET /api/sessions/:id/export
// @desc    Exportar datos de sesión (notas y chat)
// @access  Private
router.get('/:id/export', asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;

  // Verificar que el usuario tiene acceso a la sesión
  const { data: attendance, error: attError } = await supabaseAdmin
    .from('session_attendance')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (attError || !attendance) {
    throw createForbiddenError('No tienes acceso a esta sesión');
  }

  // Obtener datos de la sesión
  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .select('title, session_notes, chat_history')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    throw createNotFoundError('No se pudo encontrar la sesión solicitada');
  }

  res.json({
    success: true,
    data: {
      session: {
        id: sessionId,
        title: session.title,
        session_notes: session.session_notes,
        chat_history: session.chat_history
      }
    }
  });
}));

// @route   PATCH /api/sessions/:id/status
// @desc    Forzar cambio de estado de una sesión (organizador o roles admin/moderator del grupo)
// @access  Private
router.patch('/:id/status', [
  body('status').isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed']).withMessage('Estado inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const sessionId = req.params.id;
  const userId = req.user.id;
  const { status } = req.body;

  // Obtener sesión y grupo
  const { data: existingSession, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('id, organizer_id, group_id, status, scheduled_date, duration, actual_start_time, actual_end_time')
    .eq('id', sessionId)
    .single();

  if (sessionError || !existingSession) {
    throw createNotFoundError('No se pudo encontrar la sesión solicitada');
  }

  // Verificar permisos: organizador o admin/moderator del grupo
  let isAllowed = existingSession.organizer_id === userId;
  if (!isAllowed) {
    const { data: membership } = await supabaseAdmin
      .from('group_members')
      .select('role, status')
      .eq('group_id', existingSession.group_id)
      .eq('user_id', userId)
      .single();
    isAllowed = !!membership && membership.status === 'active' && ['admin', 'moderator'].includes(membership.role);
  }

  if (!isAllowed) {
    throw createForbiddenError('No tienes permisos para cambiar el estado de esta sesión');
  }

  const updateData = { status };
  // Timestamps derivados
  if (status === 'in_progress' && existingSession.status !== 'in_progress') {
    updateData.actual_start_time = new Date().toISOString();
  }
  if (status === 'completed' && existingSession.status !== 'completed') {
    updateData.actual_end_time = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (updateError) {
    throw new AppError('Error actualizando estado de sesión: ' + updateError.message, 500);
  }

  res.json({
    success: true,
    message: 'Estado de sesión actualizado',
    data: { session: updated }
  });
}));

// @route   GET /api/sessions/:id/resources
// @desc    Get resources linked to a session
// @access  Private
router.get('/:id/resources', asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;

  // Verify session exists and user has access
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('id, group_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw createNotFoundError('Sesión no encontrada');
  }

  // Verify user is member of the group
  const { data: member } = await supabaseAdmin
    .from('group_members')
    .select('id')
    .eq('group_id', session.group_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!member) {
    throw createForbiddenError('No tienes acceso a esta sesión');
  }

  // Get resources linked to session via files table
  const { data: resources, error: resourcesError } = await supabaseAdmin
    .from('files')
    .select(`
      id, name, resource_type, size, is_public, created_at, uploaded_by, mime_type, storage_path, original_name,
      uploader:uploaded_by (id, name, avatar, university, career)
    `)
    .eq('session_id', sessionId)
    .eq('is_deleted', false);

  if (resourcesError) {
    throw new AppError('Error obteniendo recursos: ' + resourcesError.message, 500);
  }

  res.json({
    success: true,
    data: { resources: resources || [] }
  });
}));

// @route   POST /api/sessions/:id/resources/link
// @desc    Link existing resource to session
// @access  Private
router.post('/:id/resources/link', [
  body('file_id').isUUID().withMessage('ID de archivo inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const sessionId = req.params.id;
  const userId = req.user.id;
  const { file_id } = req.body;

  // Verify session exists and user has access
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('id, group_id, organizer_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw createNotFoundError('Sesión no encontrada');
  }

  // Verify user is member or organizer
  const { data: member } = await supabaseAdmin
    .from('group_members')
    .select('id, role')
    .eq('group_id', session.group_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!member && session.organizer_id !== userId) {
    throw createForbiddenError('No tienes permiso para agregar recursos');
  }

  // Verify file exists and user has access to it
  const { data: file, error: fileError } = await supabaseAdmin
    .from('files')
    .select('id, name, group_id, is_public')
    .eq('id', file_id)
    .single();

  if (fileError || !file) {
    throw createNotFoundError('Archivo no encontrado');
  }

  // Verify file is either public or belongs to the same group
  if (!file.is_public && file.group_id !== session.group_id) {
    throw createForbiddenError('No tienes acceso a este archivo');
  }

  // Link resource to session by updating the file's session_id
  const { data: updatedFile, error: linkError } = await supabaseAdmin
    .from('files')
    .update({ session_id: sessionId })
    .eq('id', file_id)
    .select()
    .single();

  if (linkError) {
    throw new AppError('Error agregando recurso: ' + linkError.message, 500);
  }

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`session:${sessionId}`).emit('sessionResourceAdded', {
      sessionId,
      resource: updatedFile
    });
  }

  res.status(201).json({
    success: true,
    message: 'Recurso agregado a la sesión',
    data: { resource: updatedFile }
  });
}));

// @route   DELETE /api/sessions/:id/resources/:fileId
// @desc    Unlink resource from session
// @access  Private
router.delete('/:id/resources/:fileId', asyncHandler(async (req, res) => {
  const sessionId = req.params.id;
  const fileId = req.params.fileId;
  const userId = req.user.id;

  // Verify session exists and user is organizer or admin
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('id, group_id, organizer_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw createNotFoundError('Sesión no encontrada');
  }

  // Only organizer or group admin can remove resources
  const { data: member } = await supabaseAdmin
    .from('group_members')
    .select('role')
    .eq('group_id', session.group_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (session.organizer_id !== userId && member?.role !== 'admin') {
    throw createForbiddenError('Solo el organizador o administrador puede quitar recursos');
  }

  // Unlink resource from session (set session_id to null)
  const { error: deleteError } = await supabaseAdmin
    .from('files')
    .update({ session_id: null })
    .eq('id', fileId)
    .eq('session_id', sessionId); // Ensure it belongs to this session

  if (deleteError) {
    throw new AppError('Error quitando recurso: ' + deleteError.message, 500);
  }

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`session:${sessionId}`).emit('sessionResourceRemoved', {
      sessionId,
      fileId
    });
  }

  res.json({
    success: true,
    message: 'Recurso quitado de la sesión'
  });
}));

// @route   PUT /api/sessions/:id/notes/shared
// @desc    Update shared session notes (organizer only)
// @access  Private
router.put('/:id/notes/shared', [
  body('notes').trim().notEmpty().withMessage('Las notas no pueden estar vacías')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const sessionId = req.params.id;
  const userId = req.user.id;
  const { notes } = req.body;

  // Verify session exists and user is organizer
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('id, organizer_id, session_notes')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw createNotFoundError('Sesión no encontrada');
  }

  if (session.organizer_id !== userId) {
    throw createForbiddenError('Solo el organizador puede editar las notas compartidas');
  }

  // Get existing notes structure or create new one
  let sessionNotes = session.session_notes || {};
  if (typeof sessionNotes === 'string') {
    // Migrate old format
    sessionNotes = { shared: sessionNotes, personal_notes: [] };
  } else if (!sessionNotes.personal_notes) {
    sessionNotes.personal_notes = [];
  }

  // Update shared notes
  sessionNotes.shared = notes;
  sessionNotes.updated_by = userId;
  sessionNotes.updated_at = new Date().toISOString();

  // Save to database
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('sessions')
    .update({ session_notes: sessionNotes })
    .eq('id', sessionId)
    .select('session_notes')
    .single();

  if (updateError) {
    throw new AppError('Error actualizando notas: ' + updateError.message, 500);
  }

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`session:${sessionId}`).emit('sessionNotesUpdated', {
      sessionId,
      sharedNotes: notes,
      updatedBy: userId
    });
  }

  res.json({
    success: true,
    message: 'Notas compartidas actualizadas',
    data: { session_notes: updated.session_notes }
  });
}));

// @route   PUT /api/sessions/:id/notes/personal
// @desc    Update personal notes for current user
// @access  Private
router.put('/:id/notes/personal', [
  body('notes').trim().notEmpty().withMessage('Las notas no pueden estar vacías')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const sessionId = req.params.id;
  const userId = req.user.id;
  const { notes } = req.body;

  // Verify session exists and user is a participant
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('id, group_id, session_notes')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw createNotFoundError('No se encontró la sesión. Es posible que haya sido eliminada o que no tengas acceso.');
  }

  // Verify user is member of the group
  const { data: member } = await supabaseAdmin
    .from('group_members')
    .select('id')
    .eq('group_id', session.group_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!member) {
    throw createForbiddenError('No tienes acceso a esta sesión');
  }

  // Get user info for the note
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, name')
    .eq('id', userId)
    .single();

  // Get existing notes structure or create new one
  let sessionNotes = session.session_notes || {};
  if (typeof sessionNotes === 'string') {
    // Migrate old format
    sessionNotes = { shared: sessionNotes, personal_notes: [] };
  } else if (!sessionNotes.personal_notes) {
    sessionNotes.personal_notes = [];
  }

  // Ensure personal_notes is an array
  if (!Array.isArray(sessionNotes.personal_notes)) {
    sessionNotes.personal_notes = [];
  }

  // Find or create personal note for this user
  const existingNoteIndex = sessionNotes.personal_notes.findIndex(
    n => n.user_id === userId
  );

  const personalNote = {
    user_id: userId,
    user_name: user?.name || 'Usuario',
    note: notes,
    updated_at: new Date().toISOString()
  };

  if (existingNoteIndex >= 0) {
    sessionNotes.personal_notes[existingNoteIndex] = personalNote;
  } else {
    sessionNotes.personal_notes.push(personalNote);
  }

  // Save to database
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('sessions')
    .update({ session_notes: sessionNotes })
    .eq('id', sessionId)
    .select('session_notes')
    .single();

  if (updateError) {
    throw new AppError('Error actualizando notas personales: ' + updateError.message, 500);
  }

  // Emit socket event for real-time updates
  const io = req.app.get('io');
  if (io) {
    io.to(`session:${sessionId}`).emit('personalNoteUpdated', {
      sessionId,
      personalNote,
      userId
    });
  }

  res.json({
    success: true,
    message: 'Notas personales actualizadas',
    data: {
      personal_note: personalNote,
      session_notes: updated.session_notes
    }
  });
}));

module.exports = router;

