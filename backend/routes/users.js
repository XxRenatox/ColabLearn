const express = require('express');
const bcrypt = require('bcryptjs');
const { body, query, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/database');
const {
  asyncHandler,
  AppError,
  createValidationError,
  createNotFoundError,
  createAuthError
} = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Obtener perfil del usuario actual
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, email, name, avatar, university, career, semester,
      level, xp, streak, study_hours, role, is_active, preferences,
      total_sessions, total_groups, help_given, help_received,
      last_active, created_at
    `)
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw createNotFoundError('Usuario no encontrado');
  }

  // Obtener grupos del usuario
  const { data: groups } = await supabase
    .from('group_members')
    .select(`
      role, status, joined_at,
      groups:group_id (
        id, name, subject, color, progress, status, member_count:group_members(count)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  // Obtener logros del usuario
  const { data: achievements } = await supabase
    .from('user_achievements')
    .select(`
      unlocked_at, progress,
      achievements:achievement_id (id, name, description, icon, category, xp_reward)
    `)
    .eq('user_id', userId);

  res.json({
    success: true,
    data: {
      user: {
        ...user,
        groups: groups || [],
        achievements: achievements || []
      }
    }
  });
}));

// @route   PUT /api/users/profile
// @desc    Actualizar perfil y preferencias del usuario (fusiona preferencias existentes)
// @access  Private
router.put('/profile', [
  body('university').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Universidad inválida (2-100 caracteres)'),
  body('career').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Carrera inválida (2-100 caracteres)'),
  body('semester').optional().trim().isLength({ min: 1, max: 10 }).withMessage('Semestre inválido'),
  body('avatar').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    const validStyles = ['adventurer', 'avataaars', 'big-smile', 'bottts', 'fun-emoji', 'icons', 'identicon', 'lorelei', 'micah', 'miniavs', 'open-peeps', 'personas', 'pixel-art', 'shapes', 'thumbs'];
    return validStyles.includes(value);
  }).withMessage('Estilo de avatar inválido'),
  body('preferences').optional().isObject().withMessage('Preferencias deben ser un objeto'),
  body('preferences.subjects').optional().isArray().withMessage('Materias deben ser un array'),
  body('preferences.sessionDuration').optional().isString().withMessage('Duración de sesión debe ser string'),
  body('preferences.studyFrequency').optional().isString().withMessage('Frecuencia de estudio debe ser string'),
  body('preferences.groupSize').optional().isString().withMessage('Tamaño de grupo debe ser string'),
  body('preferences.studyLocation').optional().isArray().withMessage('Lugares de estudio deben ser un array'),
  body('preferences.noiseLevel').optional().isString().withMessage('Nivel de ruido debe ser string'),
  body('preferences.studyStyle').optional().isArray().withMessage('Estilo de estudio debe ser array'),
  body('preferences.weekDays').optional().isArray().withMessage('Días deben ser un array'),
  body('preferences.timeSlots').optional().isArray().withMessage('Horarios deben ser un array'),
  body('preferences.personality').optional().isArray().withMessage('Personalidad debe ser un array'),
  body('preferences.communicationStyle').optional().isString().withMessage('Estilo de comunicación debe ser string'),
  body('preferences.goals').optional().isArray().withMessage('Objetivos deben ser un array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const userId = req.user.id;
  const updateData = req.body;

  if (!userId) {
    throw createAuthError('Usuario no autenticado');
  }

  // Obtener datos actuales del usuario
  const { data: currentUser, error: getUserError } = await supabaseAdmin
    .from('users')
    .select('id, university, career, semester, preferences, avatar')
    .eq('id', userId)
    .single();

  if (getUserError) {

    throw new AppError(`Error obteniendo usuario: ${getUserError.message}`, 500);
  }

  if (!currentUser) {

    throw createNotFoundError('Usuario');
  }

  // Fusionar preferencias existentes con las nuevas (actualización parcial)
  const existingPreferences = currentUser.preferences || {};
  const newPreferences = updateData.preferences || {};

  const mergedPreferences = {
    ...existingPreferences,
    ...newPreferences,
    timezone: newPreferences.timezone || existingPreferences.timezone || 'America/Santiago',
    bio: newPreferences.bio || existingPreferences.bio || ''
  };

  // Preparar datos para actualizar (solo campos enviados)
  const updatePayload = {
    preferences: mergedPreferences,
    updated_at: new Date().toISOString()
  };

  // Solo actualizar campos académicos si se enviaron
  if (updateData.university) updatePayload.university = updateData.university;
  if (updateData.career) updatePayload.career = updateData.career;
  if (updateData.semester) updatePayload.semester = updateData.semester;
  if (updateData.avatar !== undefined) updatePayload.avatar = updateData.avatar;

  // Actualizar usuario
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update(updatePayload)
    .eq('id', userId)
    .select('id, name, university, career, semester, preferences, avatar')
    .single();

  if (updateError) {

    throw new AppError('Error actualizando perfil: ' + updateError.message, 500);
  }

  if (!updatedUser) {
    throw createNotFoundError('Usuario');
  }

  res.json({
    success: true,
    message: 'Perfil actualizado exitosamente',
    data: {
      user: updatedUser
    }
  });
}));

// @route   PUT /api/users/preferences
// @desc    Actualizar preferencias del usuario
// @access  Private
router.put('/preferences', [
  body('studyReminders').optional().isBoolean().withMessage('studyReminders debe ser booleano'),
  body('emailNotifications').optional().isBoolean().withMessage('emailNotifications debe ser booleano'),
  body('darkMode').optional().isBoolean().withMessage('darkMode debe ser booleano'),
  body('language').optional().isIn(['es', 'en']).withMessage('Idioma debe ser es o en')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Preferencias inválidas', errors.array());
  }

  const userId = req.user.id;
  const preferences = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .update({ preferences })
    .eq('id', userId)
    .select('preferences')
    .single();

  if (error) {
    throw new AppError('Error actualizando preferencias: ' + error.message, 500);
  }

  res.json({
    success: true,
    message: 'Preferencias actualizadas exitosamente',
    data: { preferences: user.preferences }
  });
}));

// @route   PUT /api/users/password
// @desc    Cambiar contraseña del usuario
// @access  Private
router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Las contraseñas no coinciden');
    }
    return true;
  })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos de contraseña inválidos', errors.array());
  }

  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  // Obtener hash actual de la contraseña
  const { data: user, error: getUserError } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  if (getUserError || !user) {
    throw createNotFoundError('Usuario no encontrado');
  }

  // Verificar contraseña actual
  if (!user.password_hash) {
    throw new AppError('No tienes una contraseña configurada. Usa la recuperación de contraseña.', 400);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  } catch (err) {
    // Si bcrypt falla (hash inválido), tratamos como contraseña incorrecta
    isValidPassword = false;
  }

  if (!isValidPassword) {
    throw new AppError('Contraseña actual incorrecta', 400);
  }

  // Hash de la nueva contraseña
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Actualizar contraseña en Supabase Auth y nuestra tabla
  const { error: authError } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (authError) {
    throw new AppError('Error actualizando contraseña: ' + authError.message, 500);
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: hashedPassword })
    .eq('id', userId);

  if (updateError) {
    throw new AppError('Error guardando contraseña: ' + updateError.message, 500);
  }

  res.json({
    success: true,
    message: 'Contraseña actualizada exitosamente'
  });
}));

// @route   POST /api/users/xp
// @desc    Añadir XP al usuario (para gamificación)
// @access  Private (podría ser usado por sistema de logros)
router.post('/xp', [
  body('amount').isInt({ min: 1, max: 1000 }).withMessage('Cantidad de XP debe ser entre 1 y 1000'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Razón muy larga')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos de XP inválidos', errors.array());
  }

  const userId = req.user.id;
  const { amount, reason } = req.body;

  // Obtener datos actuales del usuario
  const { data: user, error: getUserError } = await supabase
    .from('users')
    .select('level, xp')
    .eq('id', userId)
    .single();

  if (getUserError || !user) {
    throw createNotFoundError('Usuario no encontrado');
  }

  // Calcular nuevo XP y nivel
  let newXP = user.xp + amount;
  let newLevel = user.level;
  let levelsGained = 0;

  // Verificar subida de nivel (fórmula: nivel * 100 XP para subir)
  while (newXP >= newLevel * 100) {
    newXP -= newLevel * 100;
    newLevel++;
    levelsGained++;
  }

  // Actualizar usuario
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({
      xp: newXP,
      level: newLevel
    })
    .eq('id', userId)
    .select('level, xp')
    .single();

  if (updateError) {
    throw new AppError('Error actualizando XP: ' + updateError.message, 500);
  }

  // Si subió de nivel, enviar notificación
  if (levelsGained > 0) {
    const io = req.app.get('io');
    const sendNotification = req.app.get('sendNotification');

    if (sendNotification) {
      sendNotification(userId, {
        type: 'level_up',
        title: '¡Nivel Alcanzado!',
        message: `¡Felicitaciones! Has alcanzado el nivel ${newLevel}`,
        data: { newLevel, levelsGained }
      });
    }
  }

  res.json({
    success: true,
    message: `${amount} XP añadido exitosamente`,
    data: {
      user: updatedUser,
      levelsGained,
      reason
    }
  });
}));

// @route   GET /api/users/stats
// @desc    Obtener estadísticas del usuario
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Estadísticas básicas del usuario
  const { data: user, error: userError } = await supabase
    .from('users')
    .select(`
      level, xp, streak, study_hours, total_sessions, total_groups,
      help_given, help_received, created_at
    `)
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw createNotFoundError('Usuario no encontrado');
  }

  // Estadísticas de sesiones del último mes
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const { data: recentSessions } = await supabase
    .from('session_attendance')
    .select(`
      actual_duration, joined_at,
      sessions:session_id (scheduled_date, duration)
    `)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('joined_at', lastMonth.toISOString());

  // Calcular estadísticas adicionales
  const totalMinutesThisMonth = recentSessions?.reduce((total, session) => {
    return total + (session.actual_duration || 0);
  }, 0) || 0;

  const sessionsThisMonth = recentSessions?.length || 0;
  const avgSessionDuration = sessionsThisMonth > 0 ? Math.round(totalMinutesThisMonth / sessionsThisMonth) : 0;

  // Estadísticas de grupos
  const { data: activeGroups } = await supabase
    .from('group_members')
    .select('groups:group_id (subject)')
    .eq('user_id', userId)
    .eq('status', 'active');

  const subjectCount = {};
  activeGroups?.forEach(member => {
    const subject = member.groups.subject;
    subjectCount[subject] = (subjectCount[subject] || 0) + 1;
  });

  const stats = {
    ...user,
    thisMonth: {
      sessions: sessionsThisMonth,
      totalMinutes: totalMinutesThisMonth,
      totalHours: Math.round((totalMinutesThisMonth / 60) * 10) / 10,
      avgSessionDuration
    },
    subjects: subjectCount,
    nextLevelXP: user.level * 100,
    progressToNextLevel: Math.round((user.xp / (user.level * 100)) * 100),
    accountAge: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
  };

  res.json({
    success: true,
    data: { stats }
  });
}));

// @route   GET /api/users/search
// @desc    Buscar usuarios por universidad/carrera
// @access  Private
router.get('/search', [
  query('q').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Búsqueda debe tener entre 2 y 100 caracteres'),
  query('university').optional().trim().isLength({ min: 2, max: 150 }).withMessage('Universidad inválida'),
  query('career').optional().trim().isLength({ min: 2, max: 150 }).withMessage('Carrera inválida'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe ser entre 1 y 50')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros de búsqueda inválidos', errors.array());
  }

  const { q, university, career, limit = 20 } = req.query;
  const currentUserId = req.user.id;

  let query = supabase
    .from('users')
    .select(`
      id, name, avatar, university, career, semester,
      level, total_sessions, created_at
    `)
    .eq('is_active', true)
    .neq('id', currentUserId) // Excluir usuario actual
    .limit(parseInt(limit));

  // Filtros
  if (q) {
    query = query.or(`name.ilike.%${q}%,university.ilike.%${q}%,career.ilike.%${q}%`);
  }
  if (university) {
    query = query.ilike('university', `%${university}%`);
  }
  if (career) {
    query = query.ilike('career', `%${career}%`);
  }

  const { data: users, error } = await query;

  if (error) {
    throw new AppError('Error buscando usuarios: ' + error.message, 500);
  }

  res.json({
    success: true,
    data: {
      users,
      count: users.length
    }
  });
}));

// @route   GET /api/users/:userId
// @desc    Obtener datos públicos de un usuario por ID
// @access  Private
router.get('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Obtener datos públicos del usuario
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, name, avatar, university, career, semester,
      level, total_sessions, total_groups, last_active, created_at
    `)
    .eq('id', userId)
    .eq('is_active', true)
    .single();

  if (error || !user) {
    throw createNotFoundError('Usuario no encontrado');
  }

  res.json({
    success: true,
    data: {
      user: {
        ...user,
        status: new Date(user.last_active) > new Date(Date.now() - 24 * 60 * 60 * 1000) ? 'En línea' : 'Desconectado'
      }
    }
  });
}));

// @route   DELETE /api/users/account
// @desc    Desactivar cuenta del usuario
// @access  Private
router.delete('/account', [
  body('password').notEmpty().withMessage('Contraseña requerida para desactivar cuenta'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Razón muy larga')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const userId = req.user.id;
  const { password, reason } = req.body;

  // Verificar contraseña
  const { data: user, error: getUserError } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  if (getUserError || !user) {
    throw createNotFoundError('Usuario no encontrado');
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError('Contraseña incorrecta', 400);
  }

  // Desactivar usuario (no eliminamos para mantener integridad de datos)
  const { error: updateError } = await supabase
    .from('users')
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
      deactivation_reason: reason
    })
    .eq('id', userId);

  if (updateError) {
    throw new AppError('Error desactivando cuenta: ' + updateError.message, 500);
  }

  // Cerrar sesión en Supabase
  await supabase.auth.signOut();

  res.json({
    success: true,
    message: 'Cuenta desactivada exitosamente'
  });
}));

module.exports = router;