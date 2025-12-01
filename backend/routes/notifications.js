const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/database');
const { 
  asyncHandler, 
  AppError, 
  createValidationError,
  createNotFoundError
} = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Obtener notificaciones del usuario
// @access  Private
router.get('/', [
  query('unread_only').optional().isBoolean().withMessage('unread_only debe ser booleano'),
  query('type').optional().isIn(['group_invite', 'session_reminder', 'achievement_unlock', 'system']).withMessage('Tipo inválido'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros de consulta inválidos', errors.array());
  }

  const { unread_only = false, type, limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;

  let query = supabaseAdmin
    .from('notifications')
    .select(`
      *,
      related_user:related_user_id (id, name, avatar),
      related_group:related_group_id (id, name, color, subject),
      related_session:related_session_id (id, title, scheduled_date)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filtros
  if (unread_only === 'true') {
    query = query.eq('is_read', false);
  }
  if (type) {
    query = query.eq('type', type);
  }

  const { data: notifications, error } = await query;

  if (error) {
    throw new AppError('Error obteniendo notificaciones: ' + error.message, 500);
  }

  res.json({
    success: true,
    data: {
      notifications,
      count: notifications.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
  });
}));

// @route   GET /api/notifications/unread-count
// @desc    Obtener cantidad de notificaciones no leídas
// @access  Private
router.get('/unread-count', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data: count, error } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw new AppError('Error obteniendo conteo de notificaciones: ' + error.message, 500);
  }

  res.json({
    success: true,
    data: {
      unreadCount: count.length || 0
    }
  });
}));

// @route   GET /api/notifications/:id
// @desc    Obtener notificación específica
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  const { data: notification, error } = await supabaseAdmin
    .from('notifications')
    .select(`
      *,
      related_user:related_user_id (id, name, avatar),
      related_group:related_group_id (id, name, color, subject),
      related_session:related_session_id (id, title, scheduled_date)
    `)
    .eq('id', notificationId)
    .eq('user_id', userId)
    .single();

  if (error || !notification) {
    throw createNotFoundError('Notificación no encontrada');
  }

  res.json({
    success: true,
    data: { notification }
  });
}));

// @route   PUT /api/notifications/:id/read
// @desc    Marcar notificación como leída
// @access  Private
router.put('/:id/read', asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  const { data: notification, error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !notification) {
    throw createNotFoundError('Notificación no encontrada');
  }

  res.json({
    success: true,
    message: 'Notificación marcada como leída',
    data: { notification }
  });
}));

// @route   PUT /api/notifications/read-all
// @desc    Marcar todas las notificaciones como leídas
// @access  Private
router.put('/read-all', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw new AppError('Error marcando notificaciones como leídas: ' + error.message, 500);
  }

  res.json({
    success: true,
    message: 'Todas las notificaciones han sido marcadas como leídas'
  });
}));

// @route   DELETE /api/notifications/:id
// @desc    Eliminar notificación
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    throw new AppError('Error eliminando notificación: ' + error.message, 500);
  }

  res.json({
    success: true,
    message: 'Notificación eliminada exitosamente'
  });
}));

// @route   DELETE /api/notifications/clear-all
// @desc    Eliminar todas las notificaciones del usuario
// @access  Private
router.delete('/clear-all', asyncHandler(async (req, res) => {
  // Verificar que el usuario esté autenticado
  if (!req.user || !req.user.id) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const userId = req.user.id;

  // Primero obtener el conteo de notificaciones antes de eliminar
  const { count: countBefore } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Eliminar todas las notificaciones del usuario
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Error eliminando notificaciones:', error);
    throw new AppError('Error eliminando notificaciones: ' + error.message, 500);
  }

  res.json({
    success: true,
    message: 'Todas las notificaciones han sido eliminadas',
    data: {
      deletedCount: countBefore || (data ? data.length : 0)
    }
  });
}));

// @route   POST /api/notifications
// @desc    Crear nueva notificación (admin/system)
// @access  Private
router.post('/', [
  body('user_id').isUUID().withMessage('ID de usuario requerido'),
  body('type').isIn(['group_invite', 'session_reminder', 'achievement_unlock', 'system']).withMessage('Tipo de notificación inválido'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Título requerido (máximo 200 caracteres)'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Mensaje requerido (máximo 1000 caracteres)'),
  body('action_url').optional().isURL().withMessage('URL de acción inválida')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos de notificación inválidos', errors.array());
  }

  const {
    user_id,
    type,
    title,
    message,
    action_url,
    metadata = {},
    related_user_id,
    related_group_id,
    related_session_id,
    expires_at
  } = req.body;

  // Verificar que el usuario existe
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', user_id)
    .single();

  if (userError || !user) {
    throw createNotFoundError('Usuario no encontrado');
  }

  const { data: notification, error } = await supabaseAdmin
    .from('notifications')
    .insert([{
      user_id,
      type,
      title,
      message,
      action_url,
      metadata,
      related_user_id,
      related_group_id,
      related_session_id,
      expires_at
    }])
    .select()
    .single();

  if (error) {
    throw new AppError('Error creando notificación: ' + error.message, 500);
  }

  // Enviar notificación en tiempo real a través de Socket.IO
  const io = req.app.get('io');
  const sendNotification = req.app.get('sendNotification');
  
  if (sendNotification && notification) {
    sendNotification(user_id, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      action_url: notification.action_url,
      metadata: notification.metadata,
      is_read: notification.is_read,
      created_at: notification.created_at,
      related_user_id: notification.related_user_id,
      related_group_id: notification.related_group_id,
      related_session_id: notification.related_session_id,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Notificación creada exitosamente',
    data: { notification }
  });
}));

// @route   POST /api/notifications/bulk
// @desc    Crear múltiples notificaciones (admin/system)
// @access  Private
router.post('/bulk', [
  body('notifications').isArray({ min: 1, max: 100 }).withMessage('Se requiere array de notificaciones (máximo 100)'),
  body('notifications.*.user_id').isUUID().withMessage('ID de usuario requerido para cada notificación'),
  body('notifications.*.type').isIn(['group_invite', 'session_reminder', 'achievement_unlock', 'system']).withMessage('Tipo de notificación inválido'),
  body('notifications.*.title').trim().isLength({ min: 1, max: 200 }).withMessage('Título requerido para cada notificación'),
  body('notifications.*.message').trim().isLength({ min: 1, max: 1000 }).withMessage('Mensaje requerido para cada notificación')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos de notificaciones inválidos', errors.array());
  }

  const { notifications } = req.body;

  // Verificar que todos los usuarios existen
  const userIds = [...new Set(notifications.map(n => n.user_id))];
  const { data: users, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id')
    .in('id', userIds);

  if (usersError) {
    throw new AppError('Error verificando usuarios: ' + usersError.message, 500);
  }

  const existingUserIds = new Set(users.map(u => u.id));
  const invalidUserIds = userIds.filter(id => !existingUserIds.has(id));

  if (invalidUserIds.length > 0) {
    throw createValidationError(`Usuarios no encontrados: ${invalidUserIds.join(', ')}`);
  }

  const { data: createdNotifications, error } = await supabaseAdmin
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) {
    throw new AppError('Error creando notificaciones: ' + error.message, 500);
  }

  // Enviar notificaciones en tiempo real a través de Socket.IO
  const sendNotification = req.app.get('sendNotification');
  
  if (sendNotification && createdNotifications && createdNotifications.length > 0) {
    // Enviar cada notificación a su usuario correspondiente
    createdNotifications.forEach(notification => {
      sendNotification(notification.user_id, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        action_url: notification.action_url,
        metadata: notification.metadata,
        is_read: notification.is_read,
        created_at: notification.created_at,
        related_user_id: notification.related_user_id,
        related_group_id: notification.related_group_id,
        related_session_id: notification.related_session_id,
      });
    });
  }

  res.status(201).json({
    success: true,
    message: `${createdNotifications.length} notificaciones creadas exitosamente`,
    data: { 
      notifications: createdNotifications,
      count: createdNotifications.length
    }
  });
}));

// @route   GET /api/notifications/types
// @desc    Obtener tipos de notificación disponibles
// @access  Private
router.get('/types', asyncHandler(async (req, res) => {
  const types = [
    {
      value: 'group_invite',
      label: 'Invitación a Grupo',
      description: 'Notificaciones sobre invitaciones a grupos de estudio',
      icon: 'users'
    },
    {
      value: 'session_reminder',
      label: 'Recordatorio de Sesión',
      description: 'Recordatorios sobre sesiones de estudio programadas',
      icon: 'clock'
    },
    {
      value: 'achievement_unlock',
      label: 'Logro Desbloqueado',
      description: 'Notificaciones sobre logros y recompensas obtenidas',
      icon: 'trophy'
    },
    {
      value: 'system',
      label: 'Sistema',
      description: 'Notificaciones generales del sistema',
      icon: 'bell'
    }
  ];

  res.json({
    success: true,
    data: { types }
  });
}));

module.exports = router;
