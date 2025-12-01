const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/database');
const {
  asyncHandler,
  AppError,
  createValidationError,
  createNotFoundError,
  createForbiddenError
} = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Algoritmo de matching entre estudiantes y grupos
 * Calcula score de compatibilidad basado en múltiples factores
 */
class MatchingAlgorithm {
  constructor() {
    // Pesos para diferentes factores de matching (configurables)
    this.weights = {
      university: 0.25,      // 25% - Match exacto de universidad
      career: 0.25,          // 25% - Match exacto de carrera
      semester: 0.15,        // 15% - Cercanía de semestre
      subject: 0.15,         // 15% - Intereses en materia específica
      groupSize: 0.10,       // 10% - Preferir grupos no llenos
      groupRating: 0.05,     // 5% - Rating promedio del grupo
      groupActivity: 0.05    // 5% - Nivel de actividad reciente
    };
  }

  /**
   * Calcula el score de compatibilidad entre un usuario y un grupo
   */
  calculateCompatibilityScore(user, group, userSubjects = []) {
    let score = 0;
    let maxScore = 0;

    // 1. Match de universidad (0 o 1)
    const universityMatch = user.university === group.university ? 1 : 0;
    score += universityMatch * this.weights.university;
    maxScore += this.weights.university;

    // 2. Match de carrera (0 o 1)
    const careerMatch = user.career === group.career ? 1 : 0;
    score += careerMatch * this.weights.career;
    maxScore += this.weights.career;

    // 3. Cercanía de semestre
    const semesterScore = this.calculateSemesterScore(user.semester, group.semester);
    score += semesterScore * this.weights.semester;
    maxScore += this.weights.semester;

    // 4. Match de materia/intereses
    const subjectScore = this.calculateSubjectScore(userSubjects, group.subject);
    score += subjectScore * this.weights.subject;
    maxScore += this.weights.subject;

    // 5. Factor de tamaño del grupo (preferir grupos con espacio disponible)
    const groupSizeScore = this.calculateGroupSizeScore(group);
    score += groupSizeScore * this.weights.groupSize;
    maxScore += this.weights.groupSize;

    // 6. Rating del grupo
    const ratingScore = group.average_rating ? group.average_rating / 5 : 0.5; // Default 0.5 si no hay rating
    score += ratingScore * this.weights.groupRating;
    maxScore += this.weights.groupRating;

    // 7. Actividad reciente del grupo
    const activityScore = this.calculateActivityScore(group.last_activity);
    score += activityScore * this.weights.groupActivity;
    maxScore += this.weights.groupActivity;

    // Normalizar score a porcentaje (0-100)
    const normalizedScore = maxScore > 0 ? (score / maxScore) * 100 : 0;

    return {
      score: Math.round(normalizedScore),
      factors: {
        university: universityMatch,
        career: careerMatch,
        semester: semesterScore,
        subject: subjectScore,
        groupSize: groupSizeScore,
        rating: ratingScore,
        activity: activityScore
      },
      breakdown: {
        university: Math.round(universityMatch * this.weights.university * 100),
        career: Math.round(careerMatch * this.weights.career * 100),
        semester: Math.round(semesterScore * this.weights.semester * 100),
        subject: Math.round(subjectScore * this.weights.subject * 100),
        groupSize: Math.round(groupSizeScore * this.weights.groupSize * 100),
        rating: Math.round(ratingScore * this.weights.groupRating * 100),
        activity: Math.round(activityScore * this.weights.groupActivity * 100)
      }
    };
  }

  /**
   * Calcula score basado en cercanía de semestre
   */
  calculateSemesterScore(userSemester, groupSemester) {
    if (!userSemester || !groupSemester) return 0;

    // Extraer números de semestre (e.g., "1er Semestre" -> 1, "3" -> 3)
    const userNum = this.extractSemesterNumber(userSemester);
    const groupNum = this.extractSemesterNumber(groupSemester);

    if (!userNum || !groupNum) return 0.5; // Default si no se puede parsear

    const diff = Math.abs(userNum - groupNum);

    // Score basado en diferencia: 1.0 para mismo semestre, 0.8 para ±1, 0.5 para ±2, etc.
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.8;
    if (diff === 2) return 0.6;
    if (diff === 3) return 0.4;
    return 0.2; // Más de 3 semestres de diferencia
  }

  /**
   * Extrae número de semestre de string
   */
  extractSemesterNumber(semesterStr) {
    if (!semesterStr) return null;

    const match = semesterStr.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Calcula score basado en intereses/materias
   */
  calculateSubjectScore(userSubjects, groupSubject) {
    if (!userSubjects || userSubjects.length === 0) return 0.5; // Neutral si no hay intereses definidos
    if (!groupSubject) return 0.5;

    // Buscar match exacto o parcial
    const exactMatch = userSubjects.some(subject =>
      subject.toLowerCase().includes(groupSubject.toLowerCase()) ||
      groupSubject.toLowerCase().includes(subject.toLowerCase())
    );

    return exactMatch ? 1.0 : 0.3; // Alto score para match, bajo para no match
  }

  /**
   * Calcula score basado en tamaño del grupo
   */
  calculateGroupSizeScore(group) {
    const maxMembers = group.max_members || 20;
    const currentMembers = group.member_count || 0;

    // Calcular porcentaje de ocupación
    const occupancyRate = currentMembers / maxMembers;

    // Preferir grupos con 40-80% de ocupación (espacio pero no vacíos)
    if (occupancyRate < 0.4) return 0.7; // Grupos poco poblados
    if (occupancyRate <= 0.8) return 1.0; // Grupos con buen balance
    if (occupancyRate <= 0.95) return 0.8; // Grupos casi llenos
    return 0.3; // Grupos muy llenos
  }

  /**
   * Calcula score basado en actividad reciente
   */
  calculateActivityScore(lastActivity) {
    if (!lastActivity) return 0.3; // Sin actividad = bajo score

    const now = new Date();
    const lastActivityDate = new Date(lastActivity);
    const daysSinceActivity = (now - lastActivityDate) / (1000 * 60 * 60 * 24);

    // Score basado en días desde última actividad
    if (daysSinceActivity <= 1) return 1.0; // Muy activo (últimas 24h)
    if (daysSinceActivity <= 3) return 0.9; // Activo (últimos 3 días)
    if (daysSinceActivity <= 7) return 0.8; // Moderadamente activo (última semana)
    if (daysSinceActivity <= 14) return 0.6; // Poco activo (últimas 2 semanas)
    if (daysSinceActivity <= 30) return 0.4; // Inactivo (último mes)
    return 0.2; // Muy inactivo (más de un mes)
  }
}

// Instancia del algoritmo
const matchingAlgorithm = new MatchingAlgorithm();

// @route   GET /api/matching/groups
// @desc    Obtener recomendaciones de grupos para un estudiante
// @access  Private
router.get('/groups', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe ser entre 1 y 50'),
  query('min_score').optional().isInt({ min: 0, max: 100 }).withMessage('Score mínimo debe ser entre 0 y 100'),
  query('exclude_joined').optional().isBoolean().withMessage('exclude_joined debe ser booleano')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros inválidos', errors.array());
  }

  const userId = req.user.id;
  const { limit = 20, min_score = 40, exclude_joined = true } = req.query;

  // Obtener perfil del usuario
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, university, career, semester, preferences, level, total_sessions')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw createNotFoundError('Usuario no encontrado');
  }

  // Extraer intereses/materias de las preferencias
  const userSubjects = user.preferences?.subjects || user.preferences?.interests || [];

  // Obtener grupos disponibles (no privados o con código de invitación)
  let groupsQuery = supabaseAdmin
    .from('groups')
    .select(`
      id, name, description, subject, university, career, semester,
      max_members, is_private, status, progress, average_rating,
      last_activity, creator_id,
      creator:creator_id (name, avatar)
    `)
    .eq('status', 'active')
    .neq('is_private', true) // Solo grupos públicos por ahora
    .order('last_activity', { ascending: false });

  // Excluir grupos a los que el usuario ya pertenece
  if (exclude_joined) {
    const { data: userGroups } = await supabaseAdmin
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    const joinedGroupIds = userGroups?.map(m => m.group_id) || [];
    if (joinedGroupIds.length > 0) {
      groupsQuery = groupsQuery.not('id', 'in', `(${joinedGroupIds.join(',')})`);
    }
  }

  const { data: groups, error: groupsError } = await groupsQuery.limit(100); // Obtener más para luego filtrar por score

  if (groupsError) {
    throw new AppError('Error obteniendo grupos: ' + groupsError.message, 500);
  }

  if (!groups || groups.length === 0) {
    return res.json({
      success: true,
      data: {
        recommendations: [],
        count: 0,
        user: {
          university: user.university,
          career: user.career,
          semester: user.semester
        }
      }
    });
  }

  // Obtener conteo de miembros para cada grupo
  const groupIds = groups.map(g => g.id);
  const { data: memberCounts, error: countError } = await supabaseAdmin
    .from('group_members')
    .select('group_id')
    .in('group_id', groupIds)
    .eq('status', 'active');

  // Crear mapa de conteos
  const memberCountMap = {};
  memberCounts?.forEach(member => {
    memberCountMap[member.group_id] = (memberCountMap[member.group_id] || 0) + 1;
  });

  // Agregar member_count a cada grupo
  const groupsWithCounts = groups.map(group => ({
    ...group,
    member_count: memberCountMap[group.id] || 0
  }));

  // Calcular scores de compatibilidad para cada grupo
  const recommendations = groupsWithCounts
    .map(group => {
      const compatibility = matchingAlgorithm.calculateCompatibilityScore(user, group, userSubjects);
      return {
        ...group,
        compatibility_score: compatibility.score,
        compatibility_factors: compatibility.factors,
        compatibility_breakdown: compatibility.breakdown
      };
    })
    .filter(group => group.compatibility_score >= min_score) // Filtrar por score mínimo
    .sort((a, b) => b.compatibility_score - a.compatibility_score) // Ordenar por score descendente
    .slice(0, limit); // Limitar resultados

  res.json({
    success: true,
    data: {
      recommendations,
      count: recommendations.length,
      user: {
        university: user.university,
        career: user.career,
        semester: user.semester,
        subjects: userSubjects
      },
      filters: {
        min_score,
        exclude_joined,
        limit
      }
    }
  });
}));

// @route   GET /api/matching/users
// @desc    Encontrar estudiantes compatibles para un grupo
// @access  Private (solo admins/moderadores del grupo)
router.get('/users/:groupId', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe ser entre 1 y 50'),
  query('min_score').optional().isInt({ min: 0, max: 100 }).withMessage('Score mínimo debe ser entre 0 y 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros inválidos', errors.array());
  }

  const { groupId } = req.params;
  const userId = req.user.id;
  const { limit = 20, min_score = 50 } = req.query;

  // Verificar que el usuario es admin/moderador del grupo
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (memberError || !membership || !['admin', 'moderator'].includes(membership.role)) {
    throw createForbiddenError('No tienes permisos para ver recomendaciones de miembros');
  }

  // Obtener detalles del grupo
  const { data: group, error: groupError } = await supabaseAdmin
    .from('groups')
    .select('id, name, university, career, semester, subject, max_members')
    .eq('id', groupId)
    .single();

  if (groupError || !group) {
    throw createNotFoundError('Grupo no encontrado');
  }

  // Obtener usuarios que no son miembros del grupo
  const { data: existingMembers } = await supabaseAdmin
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  const excludedUserIds = existingMembers?.map(m => m.user_id) || [];
  excludedUserIds.push(userId); // Excluir al usuario actual

  let usersQuery = supabaseAdmin
    .from('users')
    .select('id, name, avatar, university, career, semester, level, total_sessions, preferences')
    .eq('is_active', true)
    .not('id', 'in', `(${excludedUserIds.join(',')})`)
    .limit(200); // Obtener más para calcular scores

  const { data: users, error: usersError } = await usersQuery;

  if (usersError) {
    throw new AppError('Error obteniendo usuarios: ' + usersError.message, 500);
  }

  if (!users || users.length === 0) {
    return res.json({
      success: true,
      data: {
        recommendations: [],
        count: 0,
        group: {
          id: group.id,
          name: group.name,
          university: group.university,
          career: group.career,
          semester: group.semester
        }
      }
    });
  }

  // Calcular scores de compatibilidad para cada usuario
  const recommendations = users
    .map(user => {
      const userSubjects = user.preferences?.subjects || user.preferences?.interests || [];
      const compatibility = matchingAlgorithm.calculateCompatibilityScore(user, group, userSubjects);

      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        university: user.university,
        career: user.career,
        semester: user.semester,
        level: user.level,
        total_sessions: user.total_sessions,
        compatibility_score: compatibility.score,
        compatibility_factors: compatibility.factors,
        compatibility_breakdown: compatibility.breakdown
      };
    })
    .filter(user => user.compatibility_score >= min_score)
    .sort((a, b) => b.compatibility_score - a.compatibility_score)
    .slice(0, limit);

  res.json({
    success: true,
    data: {
      recommendations,
      count: recommendations.length,
      group: {
        id: group.id,
        name: group.name,
        university: group.university,
        career: group.career,
        semester: group.semester,
        subject: group.subject
      },
      filters: {
        min_score,
        limit
      }
    }
  });
}));

// @route   PUT /api/matching/preferences
// @desc    Actualizar preferencias de matching del usuario
// @access  Private
router.put('/preferences', [
  body('subjects').optional().isArray().withMessage('Subjects debe ser un array'),
  body('subjects.*').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Cada materia debe tener entre 2 y 100 caracteres'),
  body('interests').optional().isArray().withMessage('Interests debe ser un array'),
  body('interests.*').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Cada interés debe tener entre 2 y 100 caracteres'),
  body('study_preferences').optional().isObject().withMessage('study_preferences debe ser un objeto'),
  body('study_preferences.preferred_times').optional().isArray().withMessage('preferred_times debe ser un array'),
  body('study_preferences.preferred_times.*').optional().isIn(['morning', 'afternoon', 'evening', 'night']).withMessage('Tiempos inválidos'),
  body('study_preferences.group_size').optional().isIn(['small', 'medium', 'large', 'any']).withMessage('Tamaño de grupo inválido'),
  body('study_preferences.study_style').optional().isIn(['visual', 'auditory', 'kinesthetic', 'reading', 'mixed']).withMessage('Estilo de estudio inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos de preferencias inválidos', errors.array());
  }

  const userId = req.user.id;
  const { subjects, interests, study_preferences } = req.body;

  // Obtener preferencias actuales
  const { data: currentUser, error: getUserError } = await supabaseAdmin
    .from('users')
    .select('preferences')
    .eq('id', userId)
    .single();

  if (getUserError) {
    throw createNotFoundError('Usuario no encontrado');
  }

  // Actualizar preferencias
  const updatedPreferences = {
    ...currentUser.preferences,
    subjects: subjects || currentUser.preferences?.subjects || [],
    interests: interests || currentUser.preferences?.interests || [],
    study_preferences: {
      ...currentUser.preferences?.study_preferences,
      ...study_preferences
    },
    updated_at: new Date().toISOString()
  };

  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update({ preferences: updatedPreferences })
    .eq('id', userId)
    .select('id, preferences')
    .single();

  if (updateError) {
    throw new AppError('Error actualizando preferencias: ' + updateError.message, 500);
  }

  res.json({
    success: true,
    message: 'Preferencias de matching actualizadas exitosamente',
    data: {
      preferences: updatedUser.preferences
    }
  });
}));

// @route   GET /api/matching/preferences
// @desc    Obtener preferencias de matching del usuario
// @access  Private
router.get('/preferences', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('preferences')
    .eq('id', userId)
    .single();

  if (error) {
    throw createNotFoundError('Usuario no encontrado');
  }

  res.json({
    success: true,
    data: {
      preferences: user.preferences || {},
      defaults: {
        subjects: [],
        interests: [],
        study_preferences: {
          preferred_times: [],
          group_size: 'any',
          study_style: 'mixed'
        }
      }
    }
  });
}));

module.exports = router;
