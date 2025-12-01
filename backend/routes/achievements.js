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

// @route   GET /api/achievements
// @desc    Obtener logros disponibles
// @access  Private
router.get('/', [
  query('category').optional().isString().withMessage('Categoría inválida'),
  query('rarity').optional().isIn(['common', 'rare', 'epic', 'legendary']).withMessage('Rareza inválida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros de consulta inválidos', errors.array());
  }

  const { category, rarity, limit = 20, offset = 0 } = req.query;

  let query = supabaseAdmin
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filtros
  if (category) {
    query = query.eq('category', category);
  }
  if (rarity) {
    query = query.eq('rarity', rarity);
  }

  const { data: achievements, error } = await query;

  if (error) {
    throw new AppError('Error obteniendo logros: ' + error.message, 500);
  }

  res.json({
    success: true,
    data: {
      achievements,
      count: achievements.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
  });
}));

// @route   GET /api/achievements/user
// @desc    Obtener logros del usuario
// @access  Private
router.get('/user', [
  query('unlocked_only').optional().isBoolean().withMessage('unlocked_only debe ser booleano'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros de consulta inválidos', errors.array());
  }

  const { unlocked_only = false, limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;

  let query = supabaseAdmin
    .from('user_achievements')
    .select(`
      *,
      achievements:achievement_id (
        id, name, description, icon, category, rarity, xp_reward, requirements
      )
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unlocked_only === 'true') {
    query = query.not('unlocked_at', 'is', null);
  }

  const { data: userAchievements, error } = await query;

  if (error) {
    throw new AppError('Error obteniendo logros del usuario: ' + error.message, 500);
  }

  res.json({
    success: true,
    data: {
      achievements: userAchievements,
      count: userAchievements.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
  });
}));

// @route   GET /api/achievements/:id
// @desc    Obtener logro específico
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const achievementId = req.params.id;
  const userId = req.user.id;

  const { data: achievement, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('id', achievementId)
    .eq('is_active', true)
    .single();

  if (error || !achievement) {
    throw createNotFoundError('Logro no encontrado');
  }

  // Verificar si el usuario tiene este logro
  const { data: userAchievement, error: userError } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('achievement_id', achievementId)
    .eq('user_id', userId)
    .single();

  res.json({
    success: true,
    data: {
      achievement: {
        ...achievement,
        user_progress: userAchievement || null
      }
    }
  });
}));

// @route   POST /api/achievements/:id/unlock
// @desc    Desbloquear logro manualmente (admin)
// @access  Private
router.post('/:id/unlock', asyncHandler(async (req, res) => {
  const achievementId = req.params.id;
  const userId = req.user.id;

  // Verificar que el logro existe
  const { data: achievement, error: achievementError } = await supabase
    .from('achievements')
    .select('id, xp_reward')
    .eq('id', achievementId)
    .eq('is_active', true)
    .single();

  if (achievementError || !achievement) {
    throw createNotFoundError('Logro no encontrado');
  }

  // Verificar si el usuario ya tiene este logro
  const { data: existingUserAchievement, error: existingError } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('achievement_id', achievementId)
    .eq('user_id', userId)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    throw new AppError('Error verificando logro existente: ' + existingError.message, 500);
  }

  if (existingUserAchievement) {
    throw createValidationError('Ya tienes este logro desbloqueado');
  }

  // Crear logro de usuario
  const { data: userAchievement, error: unlockError } = await supabase
    .from('user_achievements')
    .insert([{
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
      progress: { completed: true }
    }])
    .select()
    .single();

  if (unlockError) {
    throw new AppError('Error desbloqueando logro: ' + unlockError.message, 500);
  }

  // Actualizar XP del usuario si el logro tiene recompensa
  if (achievement.xp_reward > 0) {
    // Obtener XP actual del usuario
    const { data: currentUser } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single();
    
    const newXp = (currentUser?.xp || 0) + achievement.xp_reward;
    
    const { error: xpError } = await supabase
      .from('users')
      .update({ xp: newXp })
      .eq('id', userId);

    if (xpError) {
      // No fallar la operación por esto
    }
  }

  res.json({
    success: true,
    message: 'Logro desbloqueado exitosamente',
    data: { 
      userAchievement,
      xpReward: achievement.xp_reward
    }
  });
}));

// @route   GET /api/achievements/stats
// @desc    Obtener estadísticas de logros del usuario
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Obtener estadísticas generales
  const { data: stats, error: statsError } = await supabase
    .from('user_achievements')
    .select(`
      achievements:achievement_id (rarity, xp_reward)
    `)
    .eq('user_id', userId)
    .not('unlocked_at', 'is', null);

  if (statsError) {
    throw new AppError('Error obteniendo estadísticas: ' + statsError.message, 500);
  }

  // Calcular estadísticas
  const totalUnlocked = stats.length;
  const xpEarned = stats.reduce((sum, item) => sum + (item.achievements?.xp_reward || 0), 0);
  
  const rarityCounts = stats.reduce((acc, item) => {
    const rarity = item.achievements?.rarity || 'common';
    acc[rarity] = (acc[rarity] || 0) + 1;
    return acc;
  }, {});

  // Obtener total de logros disponibles
  const { data: totalAchievements, error: totalError } = await supabase
    .from('achievements')
    .select('id', { count: 'exact' })
    .eq('is_active', true);

  if (totalError) {
    throw new AppError('Error obteniendo total de logros: ' + totalError.message, 500);
  }

  const completionPercentage = totalAchievements.length > 0 
    ? Math.round((totalUnlocked / totalAchievements.length) * 100) 
    : 0;

  res.json({
    success: true,
    data: {
      totalUnlocked,
      totalAvailable: totalAchievements.length,
      completionPercentage,
      xpEarned,
      rarityBreakdown: rarityCounts
    }
  });
}));

// @route   POST /api/achievements/check
// @desc    Verificar y desbloquear logros automáticamente
// @access  Private
router.post('/check', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Obtener datos del usuario
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, level, xp, streak, study_hours, total_sessions, total_groups, help_given, help_received')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('Error obteniendo datos del usuario: ' + userError.message, 500);
  }

  // Obtener logros disponibles
  const { data: achievements, error: achievementsError } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true);

  if (achievementsError) {
    throw new AppError('Error obteniendo logros: ' + achievementsError.message, 500);
  }

  // Obtener logros ya desbloqueados por el usuario
  const { data: unlockedAchievements, error: unlockedError } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
    .not('unlocked_at', 'is', null);

  if (unlockedError) {
    throw new AppError('Error obteniendo logros desbloqueados: ' + unlockedError.message, 500);
  }

  const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievement_id));
  const newlyUnlocked = [];

  // Verificar cada logro
  for (const achievement of achievements) {
    if (unlockedIds.has(achievement.id)) continue;

    const requirements = achievement.requirements;
    let shouldUnlock = true;

    // Verificar cada requisito
    for (const [key, value] of Object.entries(requirements)) {
      switch (key) {
        case 'min_level':
          if (user.level < value) shouldUnlock = false;
          break;
        case 'min_xp':
          if (user.xp < value) shouldUnlock = false;
          break;
        case 'min_streak':
          if (user.streak < value) shouldUnlock = false;
          break;
        case 'min_study_hours':
          if (user.study_hours < value) shouldUnlock = false;
          break;
        case 'min_sessions':
          if (user.total_sessions < value) shouldUnlock = false;
          break;
        case 'min_groups':
          if (user.total_groups < value) shouldUnlock = false;
          break;
        case 'min_help_given':
          if (user.help_given < value) shouldUnlock = false;
          break;
        case 'min_help_received':
          if (user.help_received < value) shouldUnlock = false;
          break;
      }
    }

    if (shouldUnlock) {
      // Desbloquear logro
      const { data: userAchievement, error: unlockError } = await supabase
        .from('user_achievements')
        .insert([{
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
          progress: { completed: true }
        }])
        .select()
        .single();

      if (!unlockError) {
        newlyUnlocked.push({
          ...achievement,
          userAchievement
        });

        // Actualizar XP si tiene recompensa
        if (achievement.xp_reward > 0) {
          const { data: currentUser } = await supabase
            .from('users')
            .select('xp')
            .eq('id', userId)
            .single();
          
          const newXp = (currentUser?.xp || 0) + achievement.xp_reward;
          
          await supabase
            .from('users')
            .update({ xp: newXp })
            .eq('id', userId);
        }
      }
    }
  }

  res.json({
    success: true,
    message: `Se desbloquearon ${newlyUnlocked.length} logros`,
    data: {
      newlyUnlocked,
      count: newlyUnlocked.length
    }
  });
}));

module.exports = router;
