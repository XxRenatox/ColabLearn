const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { supabase } = require('../config/database');
const {
  asyncHandler,
  AppError,
  createValidationError,
  createNotFoundError,
  createForbiddenError
} = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/connections
// @desc    Obtener conexiones del usuario (estudiantes con quienes ha estudiado)
// @access  Private
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe ser entre 1 y 50'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset debe ser mayor o igual a 0')
], asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 20, offset = 0 } = req.query;

  // Obtener conexiones basadas en grupos compartidos y sesiones
  // 1. Obtener grupos en común
  const { data: sharedGroups, error: groupsError } = await supabase
    .from('group_members')
    .select(`
      group_id,
      joined_at,
      groups:group_id (
        id, name, subject, university, career,
        last_activity
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (groupsError) {
    throw new AppError('Error obteniendo grupos compartidos: ' + groupsError.message, 500);
  }

  const groupIds = sharedGroups?.map(g => g.group_id) || [];

  if (groupIds.length === 0) {
    return res.json({
      success: true,
      data: {
        connections: [],
        count: 0,
        summary: {
          total_groups_shared: 0,
          total_sessions_shared: 0
        }
      }
    });
  }

  // 2. Obtener otros miembros de esos grupos
  const { data: groupMembers, error: membersError } = await supabase
    .from('group_members')
    .select(`
      user_id,
      group_id,
      joined_at,
      role,
      users:user_id (
        id, name, avatar, university, career, semester,
        level, total_sessions, last_active, is_active
      )
    `)
    .in('group_id', groupIds)
    .eq('status', 'active')
    .neq('user_id', userId); // Excluir al usuario actual

  if (membersError) {
    throw new AppError('Error obteniendo miembros de grupos: ' + membersError.message, 500);
  }

  // 3. Agregar sesiones compartidas
  const { data: sessionAttendance, error: sessionError } = await supabase
    .from('session_attendance')
    .select(`
      session_id,
      sessions:session_id (
        group_id,
        title,
        scheduled_date
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'confirmed');

  if (sessionError) {
    // Error obteniendo sesiones
  }

  // 4. Agrupar conexiones por usuario
  const connectionsMap = new Map();

  groupMembers?.forEach(member => {
    const user = member.users;
    if (!user || !user.is_active) return;

    const userId = user.id;
    if (!connectionsMap.has(userId)) {
      connectionsMap.set(userId, {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        university: user.university,
        career: user.career,
        semester: user.semester,
        level: user.level,
        total_sessions: user.total_sessions,
        lastActive: user.last_active,
        shared_groups: [],
        shared_sessions: 0,
        mutual_subjects: 0,
        last_contact: member.joined_at,
        relationship: 'Compañero de estudio',
        status: new Date(user.last_active) > new Date(Date.now() - 24 * 60 * 60 * 1000) ? 'En línea' : 'Desconectado'
      });
    }

    // Agregar grupo compartido
    const connection = connectionsMap.get(userId);
    const groupInfo = sharedGroups.find(g => g.group_id === member.group_id);
    if (groupInfo) {
      connection.shared_groups.push({
        id: groupInfo.groups.id,
        name: groupInfo.groups.name,
        subject: groupInfo.groups.subject,
        joined_at: member.joined_at
      });

      // Calcular último contacto
      if (new Date(member.joined_at) > new Date(connection.last_contact)) {
        connection.last_contact = member.joined_at;
      }
    }
  });

  // 5. Calcular estadísticas adicionales
  const connections = Array.from(connectionsMap.values());

  connections.forEach(connection => {
    // Calcular sesiones compartidas
    const sharedSessionCount = sessionAttendance?.filter(attendance => {
      const session = attendance.sessions;
      return session && connection.shared_groups.some(group => group.id === session.group_id);
    }).length || 0;

    connection.shared_sessions = sharedSessionCount;

    // Calcular materias en común (basado en grupos compartidos)
    const uniqueSubjects = new Set(connection.shared_groups.map(g => g.subject));
    connection.mutual_subjects = uniqueSubjects.size;
  });

  // 6. Ordenar por último contacto y limitar resultados
  connections.sort((a, b) => new Date(b.last_contact) - new Date(a.last_contact));
  const paginatedConnections = connections.slice(offset, offset + limit);

  res.json({
    success: true,
    data: {
      connections: paginatedConnections,
      count: paginatedConnections.length,
      total: connections.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      summary: {
        total_groups_shared: groupIds.length,
        total_sessions_shared: sessionAttendance?.length || 0,
        total_connections: connections.length
      }
    }
  });
}));

// @route   GET /api/connections/:userId
// @desc    Obtener detalles de una conexión específica
// @access  Private
router.get('/:userId', asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { userId } = req.params;

  // Verificar que existe conexión entre los usuarios
  const { data: connectionData, error: connectionError } = await supabase
    .from('group_members')
    .select(`
      group_id,
      joined_at,
      groups:group_id (
        id, name, subject, university, career, description,
        last_activity, total_sessions
      )
    `)
    .eq('user_id', currentUserId)
    .eq('status', 'active');

  if (connectionError) {
    throw new AppError('Error verificando conexión: ' + connectionError.message, 500);
  }

  const userGroups = connectionData?.map(c => c.group_id) || [];

  const { data: otherUserGroups, error: otherUserError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (otherUserError) {
    throw createNotFoundError('Usuario no encontrado');
  }

  const otherUserGroupIds = otherUserGroups?.map(g => g.group_id) || [];
  const sharedGroupIds = userGroups.filter(id => otherUserGroupIds.includes(id));

  if (sharedGroupIds.length === 0) {
    throw createForbiddenError('No tienes conexión con este usuario');
  }

  // Obtener datos completos del usuario
  const { data: user, error: userError } = await supabase
    .from('users')
    .select(`
      id, name, avatar, university, career, semester, level,
      xp, streak, study_hours, total_sessions, total_groups,
      last_active, email, created_at,
      preferences
    `)
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw createNotFoundError('Usuario no encontrado');
  }

  // Obtener grupos compartidos con detalles
  const { data: sharedGroups, error: sharedError } = await supabase
    .from('group_members')
    .select(`
      group_id,
      joined_at,
      role,
      groups:group_id (
        id, name, subject, university, career, semester,
        description, last_activity, total_sessions, average_rating
      )
    `)
    .eq('user_id', userId)
    .in('group_id', sharedGroupIds)
    .eq('status', 'active');

  if (sharedError) {
    throw new AppError('Error obteniendo grupos compartidos: ' + sharedError.message, 500);
  }

  // Obtener sesiones compartidas
  // Primero obtener los IDs de sesiones que pertenecen a grupos compartidos
  const { data: sessionsInSharedGroups, error: sessionsInGroupsError } = await supabase
    .from('sessions')
    .select('id')
    .in('group_id', sharedGroupIds);

  if (sessionsInGroupsError) {
    console.error('Error obteniendo sesiones de grupos compartidos:', sessionsInGroupsError);
  }

  const sessionIds = sessionsInSharedGroups?.map(s => s.id) || [];

  let sharedSessions = [];
  if (sessionIds.length > 0) {
    const { data: sessionsAttendance, error: sessionsError } = await supabase
      .from('session_attendance')
      .select(`
        session_id,
        status,
        joined_at,
        sessions:session_id (
          id, title, scheduled_date, duration, status, group_id,
          organizer:organizer_id (name)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .in('session_id', sessionIds)
      .order('joined_at', { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.error('Error obteniendo sesiones compartidas:', sessionsError);
    } else {
      sharedSessions = sessionsAttendance || [];
    }
  }

  // Calcular estadísticas de conexión
  const stats = {
    groups_shared: sharedGroups?.length || 0,
    sessions_attended_together: sharedSessions?.length || 0,
    first_connection: sharedGroups?.reduce((earliest, group) =>
      !earliest || new Date(group.joined_at) < new Date(earliest) ? group.joined_at : earliest
    , null),
    last_activity: sharedGroups?.reduce((latest, group) =>
      !latest || new Date(group.groups?.last_activity) > new Date(latest) ? group.groups.last_activity : latest
    , null)
  };

  res.json({
    success: true,
    data: {
      user: {
        ...user,
        status: new Date(user.last_active) > new Date(Date.now() - 24 * 60 * 60 * 1000) ? 'En línea' : 'Desconectado',
        account_age: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
      },
      shared_groups: sharedGroups || [],
      shared_sessions: sharedSessions || [],
      stats
    }
  });
}));

module.exports = router;
