const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/database');
const {
  asyncHandler,
  AppError,
  createValidationError,
  createNotFoundError,
  createForbiddenError,
  createAuthError
} = require('../middleware/errorHandler');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/groups
// @desc    Obtener grupos del usuario o grupos públicos disponibles
// @access  Private
router.get(
  '/',
  [
    query('status').optional().isIn(['active', 'inactive', 'archived']).withMessage('Estado inválido'),
    query('role').optional().isIn(['admin', 'moderator', 'member']).withMessage('Rol inválido'),
    query('public').optional().isBoolean().withMessage('public debe ser booleano'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
  ],
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { status = 'active', role, public: isPublic = false, limit = 50 } = req.query;

    if (isPublic === true || isPublic === 'true') {
      const { data: groups, error } = await supabaseAdmin
        .from('groups')
        .select(`
          id, name, description, subject, university, career, semester,
          color, max_members, is_private, progress, status, last_activity,
          creator_id, total_sessions, total_hours, average_rating, require_approval,
          invite_code,
          creator:creator_id (name, avatar)
        `)
        .eq('status', status)
        .order('last_activity', { ascending: false })
        .limit(Number(limit));

      if (error) {
        throw new AppError('Error obteniendo grupos públicos: ' + error.message, 500);
      }

      const groupIds = groups?.map((g) => g.id) || [];
      const memberCounts = {};
      const userMemberships = {};

      if (groupIds.length > 0) {
        const [countsResult, membershipResult] = await Promise.all([
          supabaseAdmin
            .from('group_members')
            .select('group_id')
            .in('group_id', groupIds)
            .eq('status', 'active'),
          supabaseAdmin
            .from('group_members')
            .select('group_id, status, role')
            .in('group_id', groupIds)
            .eq('user_id', userId)
        ]);

        if (!countsResult.error && countsResult.data) {
          countsResult.data.forEach((member) => {
            memberCounts[member.group_id] = (memberCounts[member.group_id] || 0) + 1;
          });
        }

        if (!membershipResult.error && membershipResult.data) {
          membershipResult.data.forEach((membership) => {
            userMemberships[membership.group_id] = {
              status: membership.status,
              role: membership.role,
              is_member: membership.status === 'active',
              is_pending: membership.status === 'pending'
            };
          });
        }
      }

      const groupsWithCounts = (groups || []).map((group) => ({
        ...group,
        member_count: memberCounts[group.id] || 0,
        is_user_member: userMemberships[group.id]?.is_member || false,
        membership_status: userMemberships[group.id]?.status || null,
        userRole: userMemberships[group.id]?.role || null,
        is_pending: userMemberships[group.id]?.is_pending || false,
      }));

      return res.json({
        success: true,
        data: {
          groups: groupsWithCounts,
          count: groupsWithCounts.length,
        },
      });
    }

    let queryBuilder = supabaseAdmin
      .from('group_members')
      .select(`
        role, status, joined_at,
        groups:group_id (
          id, name, description, subject, university, career, semester,
          color, max_members, is_private, progress, status, last_activity,
          creator_id, total_sessions, total_hours, average_rating, require_approval,
          allow_invites, invite_code,
          creator:creator_id (name, avatar)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('groups.status', status)
      .order('joined_at', { ascending: false });

    if (role) {
      queryBuilder = queryBuilder.eq('role', role);
    }

    const { data: memberships, error } = await queryBuilder;

    if (error) {
      throw new AppError('Error obteniendo grupos: ' + error.message, 500);
    }

    const groupIds = memberships?.map((m) => m.groups?.id).filter(Boolean) || [];
    const memberCounts = {};

    if (groupIds.length > 0) {
      const { data: counts, error: countError } = await supabaseAdmin
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds)
        .eq('status', 'active');

      if (!countError && counts) {
        counts.forEach((member) => {
          memberCounts[member.group_id] = (memberCounts[member.group_id] || 0) + 1;
        });
      }
    }

    const groups = (memberships || []).map((membership) => ({
      ...membership.groups,
      userRole: membership.role,
      joinedAt: membership.joined_at,
      member_count: memberCounts[membership.groups?.id] || 0,
      is_user_member: true,
    }));

    return res.json({
      success: true,
      data: {
        groups,
        count: groups.length,
      },
    });
  })
);

// @route   GET /api/groups/:id/progress
// @desc    Calcular y obtener el progreso del semestre del grupo
// @access  Private (miembros del grupo)
router.get('/:id/progress', asyncHandler(async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user.id;

  // Verificar que el usuario es miembro activo del grupo (usar supabaseAdmin para bypass RLS)
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('role, status')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  if (memberError || !membership || membership.status !== 'active') {
    throw createForbiddenError('No tienes acceso a este grupo');
  }

  // Obtener datos mínimos del grupo (usar supabaseAdmin para bypass RLS)
  const { data: group, error: groupError } = await supabaseAdmin
    .from('groups')
    .select('id, start_date, end_date, total_weeks, current_week, created_at')
    .eq('id', groupId)
    .single();

  if (groupError || !group) {
    throw createNotFoundError('Grupo no encontrado');
  }

  const today = new Date();
  const startDate = group.start_date ? new Date(group.start_date) : (group.created_at ? new Date(group.created_at) : null);
  const endDate = group.end_date ? new Date(group.end_date) : null;

  let totalWeeks = group.total_weeks || 16;
  if (!group.total_weeks && startDate && endDate) {
    const diffMs = endDate.getTime() - startDate.getTime();
    totalWeeks = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7)));
  }

  let currentWeek = 1;
  if (startDate) {
    const diffMs = Math.max(0, today.getTime() - startDate.getTime());
    currentWeek = Math.min(totalWeeks, Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1));
  }

  const percentage = Math.min(100, Math.round((currentWeek / totalWeeks) * 100));
  const isCompleted = endDate ? today > endDate : currentWeek >= totalWeeks;

  // Intentar persistir current_week si la columna existe (usar supabaseAdmin para bypass RLS)
  try {
    await supabaseAdmin
      .from('groups')
      .update({ current_week: currentWeek, progress: percentage, last_activity: new Date().toISOString() })
      .eq('id', groupId);
  } catch (e) {
    // Si la columna no existe, ignorar
  }

  res.json({
    success: true,
    data: {
      currentWeek,
      totalWeeks,
      percentage,
      isCompleted,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null
    }
  });
}));

// @route   GET /api/groups/:id
// @desc    Obtener detalles de un grupo específico
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user.id;

  // Verificar que el usuario es miembro del grupo
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('role, status, joined_at')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  if (memberError || !membership || membership.status !== 'active') {
    throw createForbiddenError('No tienes acceso a este grupo');
  }

  // Obtener detalles completos del grupo
  const { data: group, error: groupError } = await supabaseAdmin
    .from('groups')
    .select(`
      *,
      creator:creator_id (id, name, avatar),
      members:group_members!inner (
        id, role, status, joined_at,
        user:user_id (
          id, name, avatar, email, level, total_sessions,
          university, career, semester, study_hours, xp, last_active
        )
      )
    `)
    .eq('id', groupId)
    .single();

  if (groupError || !group) {
    throw createNotFoundError('Grupo no encontrado');
  }

  // Calcular conteo de miembros activos
  const activeMembers = group.members?.filter(m => m.status === 'active') || [];
  const groupWithCount = {
    ...group,
    members: activeMembers,
    member_count: activeMembers.length
  };

  // Obtener próximas sesiones del grupo
  const { data: upcomingSessions } = await supabaseAdmin
    .from('sessions')
    .select(`
      id, title, scheduled_date, duration, status, max_attendees,
      attendee_count:session_attendance(count),
      organizer:organizer_id (name, avatar)
    `)
    .eq('group_id', groupId)
    .gte('scheduled_date', new Date().toISOString())
    .order('scheduled_date', { ascending: true })
    .limit(5);

  res.json({
    success: true,
    data: {
      group: {
        ...groupWithCount,
        userRole: membership.role,
        upcomingSessions: upcomingSessions || []
      }
    }
  });
}));

// @route   POST /api/groups
// @desc    Crear nuevo grupo
// @access  Private
router.post('/', [
  body('name').trim().isLength({ min: 3, max: 150 }).withMessage('Nombre debe tener entre 3 y 150 caracteres'),
  body('subject').trim().notEmpty().withMessage('Materia es requerida'),
  body('university').trim().notEmpty().withMessage('Universidad es requerida'),
  body('career').trim().notEmpty().withMessage('Carrera es requerida'),
  body('semester').trim().notEmpty().withMessage('Semestre es requerido'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Descripción muy larga'),
  body('max_members').optional().isInt({ min: 2, max: 100 }).withMessage('Máximo miembros debe ser entre 2 y 100'),
  body('is_private').optional().isBoolean().withMessage('is_private debe ser booleano'),
  body('allow_invites').optional().isBoolean().withMessage('allow_invites debe ser booleano'),
  body('require_approval').optional().isBoolean().withMessage('require_approval debe ser booleano')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos del grupo inválidos', errors.array());
  }

  const {
    name,
    description,
    subject,
    university,
    career,
    semester,
    max_members = 20,
    is_private = false,
    allow_invites = true,
    require_approval = false,
    color = 'bg-blue-500'
  } = req.body;

  const userId = req.user.id;

  // Crear grupo en una transacción
  const { data: group, error: groupError } = await supabaseAdmin
    .from('groups')
    .insert([{
      name,
      description,
      subject,
      university,
      career,
      semester,
      color,
      creator_id: userId,
      max_members: max_members,
      is_private: is_private,
      allow_invites: allow_invites,
      require_approval: require_approval
    }])
    .select()
    .single();

  if (groupError) {
    throw new AppError('Error creando grupo: ' + groupError.message, 500);
  }

  // Añadir creador como admin del grupo
  const { error: memberError } = await supabaseAdmin
    .from('group_members')
    .insert([{
      group_id: group.id,
      user_id: userId,
      role: 'admin',
      status: 'active'
    }]);

  if (memberError) {
    // Si falla, eliminar el grupo creado
    await supabaseAdmin.from('groups').delete().eq('id', group.id);
    throw new AppError('Error configurando membresía: ' + memberError.message, 500);
  }

  // Actualizar contador de grupos del usuario
  const { data: currentUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('total_groups')
    .eq('id', userId)
    .single();

  if (userError) {
    throw new AppError('Error obteniendo datos del usuario: ' + userError.message, 500);
  }

  const { error: updateUserError } = await supabaseAdmin
    .from('users')
    .update({
      total_groups: (currentUser.total_groups || 0) + 1
    })
    .eq('id', userId);

  if (updateUserError) {
    throw new AppError('Error actualizando contador de grupos: ' + updateUserError.message, 500);
  }

  res.status(201).json({
    success: true,
    message: 'Grupo creado exitosamente',
    data: { group }
  });
}));

// @route   PUT /api/groups/:id
// @desc    Actualizar grupo (solo admins/moderadores)
// @access  Private
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 3, max: 150 }).withMessage('Nombre inválido'),
  body('subject').optional().trim().notEmpty().withMessage('Materia es requerida'),
  body('university').optional().trim().notEmpty().withMessage('Universidad es requerida'),
  body('career').optional().trim().notEmpty().withMessage('Carrera es requerida'),
  body('semester').optional().trim().notEmpty().withMessage('Semestre es requerido'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Descripción muy larga'),
  body('max_members').optional().isInt({ min: 2, max: 100 }).withMessage('Máximo miembros inválido'),
  body('is_private').optional().isBoolean().withMessage('is_private debe ser booleano'),
  body('allow_invites').optional().isBoolean().withMessage('allow_invites debe ser booleano'),
  body('require_approval').optional().isBoolean().withMessage('require_approval debe ser booleano'),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progreso debe ser entre 0 y 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos de actualización inválidos', errors.array());
  }

  const groupId = req.params.id;
  const userId = req.user.id;

  // Verificar permisos de moderación
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (memberError || !membership || !['admin', 'moderator'].includes(membership.role)) {
    throw createForbiddenError('No tienes permisos para editar este grupo');
  }

  const updateData = { ...req.body };
  delete updateData.creator_id; // No permitir cambiar creador

  const { data: group, error } = await supabaseAdmin
    .from('groups')
    .update({
      ...updateData,
      last_activity: new Date().toISOString()
    })
    .eq('id', groupId)
    .select()
    .single();

  if (error) {
    throw new AppError('Error actualizando grupo: ' + error.message, 500);
  }

  // Notificar a miembros del grupo sobre la actualización
  const sendGroupUpdate = req.app.get('sendGroupUpdate');
  if (sendGroupUpdate) {
    sendGroupUpdate(groupId, {
      type: 'group_updated',
      data: group
    });
  }

  res.json({
    success: true,
    message: 'Grupo actualizado exitosamente',
    data: { group }
  });
}));

// @route   POST /api/groups/:id/join
// @desc    Unirse a un grupo
// @access  Private
router.post('/:id/join', [
  body('inviteCode').optional({ nullable: true, checkFalsy: true }).custom((value) => {
    // Si se proporciona un código, debe tener entre 6 y 10 caracteres
    if (value && value.trim().length > 0) {
      if (value.trim().length < 6 || value.trim().length > 10) {
        throw new Error('Código de invitación debe tener entre 6 y 10 caracteres');
      }
    }
    return true;
  })
], asyncHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createValidationError('Datos inválidos', errors.array());
    }

    const groupId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      throw createAuthError('Usuario no autenticado');
    }

    const { inviteCode } = req.body || {};

    // Normalizar código de invitación si existe
    const normalizedInviteCode = inviteCode && inviteCode.trim() ? inviteCode.trim().toUpperCase() : null;

    // Obtener detalles del grupo
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('*, creator:creator_id (id, name, avatar)')
      .eq('id', groupId)
      .eq('status', 'active')
      .single();

    if (groupError || !group) {
      throw createNotFoundError('Grupo no encontrado');
    }

    // Obtener conteo de miembros activos
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('status', 'active');

    const memberCount = memberData ? memberData.length : 0;
    const groupWithCount = { ...group, member_count: memberCount };

    // Verificar código de invitación si se proporciona
    // Si el grupo es privado y se proporciona un código, debe ser válido
    if (normalizedInviteCode) {
      // Comparar códigos normalizados (ambos en mayúsculas)
      const groupInviteCode = group.invite_code ? String(group.invite_code).toUpperCase().trim() : null;
      if (!groupInviteCode || normalizedInviteCode !== groupInviteCode) {
        throw createForbiddenError('Código de invitación incorrecto');
      }
    }
    // Si el grupo es privado y NO se proporciona código, se creará una solicitud pendiente (no rechazar)

    // Verificar si ya existe alguna membresía (incluyendo inactivas/pending)
    const { data: existingMembers, error: existingMembersError } = await supabaseAdmin
      .from('group_members')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })
      .limit(1);

    if (existingMembersError && existingMembersError.code !== 'PGRST116') {
      throw new AppError('Error verificando membresía: ' + existingMembersError.message, 500);
    }

    const existingMember = Array.isArray(existingMembers) ? existingMembers[0] : existingMembers;

    // Determinar el estado final de la membresía
    // Si tiene código válido → unirse directamente (excepción)
    // Si no tiene código y es privado → requiere aprobación
    // Si no tiene código y require_approval → requiere aprobación
    // Si no tiene código y no tiene restricciones → activo
    let finalStatus = 'active';

    // Si tiene código válido, siempre se une directamente
    const groupInviteCode = group.invite_code ? String(group.invite_code).toUpperCase().trim() : null;
    if (normalizedInviteCode && normalizedInviteCode === groupInviteCode) {
      finalStatus = 'active';
    } else if (group.is_private) {
      // Grupos privados sin código requieren aprobación
      finalStatus = 'pending';
    } else if (groupWithCount.require_approval) {
      // Grupos públicos con require_approval también requieren aprobación
      finalStatus = 'pending';
    }

    let memberId = null;
    let reactivated = false;

    if (existingMember) {
      if (existingMember.status === 'active') {
        throw new AppError('Ya eres miembro de este grupo', 409);
      } else {
        // Si tiene código válido, siempre activo (excepción)
        const groupInviteCodeForReactivate = group.invite_code ? String(group.invite_code).toUpperCase().trim() : null;
        if (normalizedInviteCode && normalizedInviteCode === groupInviteCodeForReactivate) {
          finalStatus = 'active';
        } else if (group.is_private) {
          // Grupos privados sin código requieren aprobación
          finalStatus = 'pending';
        } else if (groupWithCount.require_approval) {
          // Grupos públicos con require_approval también requieren aprobación
          finalStatus = 'pending';
        } else {
          finalStatus = 'active';
        }

        // Reactivar membresía
        const { data: updatedMember, error: reactivateError } = await supabaseAdmin
          .from('group_members')
          .update({
            status: finalStatus,
            joined_at: new Date().toISOString(),
          })
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .select('id')
          .single();

        if (reactivateError) {
          throw new AppError('Error reactivando membresía: ' + reactivateError.message, 500);
        }

        memberId = updatedMember?.id || existingMember.id;
        reactivated = finalStatus === 'active';
      }
    } else {
      // Verificar límite de miembros
      if (groupWithCount.member_count >= groupWithCount.max_members) {
        throw new AppError('El grupo ha alcanzado su límite de miembros', 409);
      }

      // Crear nueva membresía
      const { data: newMember, error: joinError } = await supabaseAdmin
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: userId,
          role: 'member',
          status: finalStatus,
          joined_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (joinError) {
        if (joinError.code === '23505') {
          throw new AppError('Ya existe una solicitud de unión pendiente para este grupo', 409);
        }
        throw new AppError('Error uniéndose al grupo: ' + joinError.message, 500);
      }

      memberId = newMember?.id;
    }

    const becameActive =
      finalStatus === 'active' && (!existingMember || existingMember.status !== 'active');

    if (becameActive || reactivated) {
      // Actualizar contador de grupos del usuario solo si la membresía quedó activa
      try {
        const { data: currentUser, error: userError } = await supabaseAdmin
          .from('users')
          .select('total_groups')
          .eq('id', userId)
          .single();

        if (!userError && currentUser) {
          const { error: updateUserError } = await supabaseAdmin
            .from('users')
            .update({
              total_groups: (currentUser.total_groups || 0) + 1
            })
            .eq('id', userId);

          if (updateUserError) {

            // No fallar la solicitud completa si hay error al actualizar el contador
          }

          // Actualizar última actividad del grupo cuando hay un nuevo miembro activo
          await supabaseAdmin
            .from('groups')
            .update({ last_activity: new Date().toISOString() })
            .eq('id', groupId);
        }
      } catch (updateErr) {
        // Si hay error al actualizar contadores, no fallar la solicitud completa

      }
    }

    // Si la solicitud quedó pendiente, notificar a admins y moderadores
    if (finalStatus === 'pending') {
      try {
        // Obtener información del usuario solicitante
        const { data: requestingUser, error: userInfoError } = await supabaseAdmin
          .from('users')
          .select('id, name, avatar')
          .eq('id', userId)
          .single();

        if (!userInfoError && requestingUser) {
          // Obtener admins y moderadores del grupo
          const { data: adminsAndMods, error: adminsError } = await supabaseAdmin
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId)
            .eq('status', 'active')
            .in('role', ['admin', 'moderator']);

          if (!adminsError && adminsAndMods && adminsAndMods.length > 0) {
            // Crear notificaciones para cada admin/moderador
            const notifications = adminsAndMods.map(admin => ({
              user_id: admin.user_id,
              type: 'system',
              title: 'Nueva solicitud de ingreso',
              message: `${requestingUser.name} solicitó ingresar al grupo "${group.name}"`,
              related_user_id: userId,
              related_group_id: groupId,
              metadata: {
                request_type: 'group_join',
                member_id: memberId || null
              },
              action_url: `/user/panel?group=${groupId}&tab=requests`
            }));

            const { error: notificationError } = await supabaseAdmin.from('notifications').insert(notifications);
            // Si hay error al crear notificaciones, no fallar la solicitud completa
            if (notificationError) {

            }
          }
        }
      } catch (notificationErr) {
        // Si hay error al crear notificaciones, no fallar la solicitud completa

      }
    }

    // Notificar a miembros del grupo (solo si se unió activamente)
    if (finalStatus === 'active') {
      try {
        const sendGroupUpdate = req.app.get('sendGroupUpdate');
        if (sendGroupUpdate) {
          sendGroupUpdate(groupId, {
            type: 'member_joined',
            data: { userId, userName: req.user.name }
          });
        }
      } catch (socketErr) {
        // Si hay error con sockets, no fallar la solicitud completa

      }
    }

    res.json({
      success: true,
      message: finalStatus === 'pending'
        ? 'Solicitud enviada. Espera la aprobación del administrador.'
        : 'Te has unido al grupo exitosamente',
      data: {
        status: finalStatus,
        is_member: finalStatus === 'active',
        is_pending: finalStatus === 'pending',
        group: groupWithCount
      }
    });
  } catch (error) {
    // Re-lanzar para que asyncHandler lo maneje
    throw error;
  }
}));

// @route   DELETE /api/groups/:id/leave
// @desc    Salir de un grupo
// @access  Private
router.delete('/:id/leave', asyncHandler(async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user.id;

  // Verificar membresía
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (memberError || !membership) {
    throw createNotFoundError('No eres miembro de este grupo');
  }

  // Verificar si es el creador y hay otros miembros
  if (membership.role === 'admin') {
    const { data: otherAdmins, error: adminError } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('role', 'admin')
      .eq('status', 'active')
      .neq('user_id', userId);

    if (adminError) {
      throw new AppError('Error verificando otros administradores', 500);
    }

    if (!otherAdmins || otherAdmins.length === 0) {
      // Obtener total de miembros activos
      const { data: allMembers } = await supabaseAdmin
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (allMembers && allMembers.length > 1) {
        throw new AppError('No puedes salir siendo el único administrador. Transfiere el rol primero.', 400);
      }
    }
  }

  // Desactivar membresía
  const { error: leaveError } = await supabaseAdmin
    .from('group_members')
    .update({ status: 'inactive' })
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (leaveError) {
    throw new AppError('Error saliendo del grupo: ' + leaveError.message, 500);
  }

  // Actualizar contador de grupos del usuario
  const { data: currentUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('total_groups')
    .eq('id', userId)
    .single();

  if (userError) {
    throw new AppError('Error obteniendo datos del usuario: ' + userError.message, 500);
  }

  const { error: updateUserError } = await supabaseAdmin
    .from('users')
    .update({
      total_groups: (currentUser.total_groups || 0) - 1
    })
    .eq('id', userId);

  if (updateUserError) {
    throw new AppError('Error actualizando contador de grupos: ' + updateUserError.message, 500);
  }

  // Notificar a otros miembros
  const sendGroupUpdate = req.app.get('sendGroupUpdate');
  if (sendGroupUpdate) {
    sendGroupUpdate(groupId, {
      type: 'member_left',
      data: { userId, userName: req.user.name }
    });
  }

  res.json({
    success: true,
    message: 'Has salido del grupo exitosamente'
  });
}));

// @route   DELETE /api/groups/:id
// @desc    Eliminar grupo completamente (solo admins)
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user.id;

  // Verificar que el usuario es admin del grupo
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (memberError || !membership || membership.role !== 'admin') {
    throw createForbiddenError('Solo el administrador puede eliminar el grupo');
  }

  // Verificar que no hay sesiones activas
  const { data: activeSessions, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('id')
    .eq('group_id', groupId)
    .eq('status', 'in_progress')
    .limit(1);

  if (sessionError) {
    throw new AppError('Error verificando sesiones activas', 500);
  }

  if (activeSessions && activeSessions.length > 0) {
    throw new AppError('No se puede eliminar un grupo con sesiones en progreso', 409);
  }

  // Obtener IDs de miembros para actualizar contadores
  const { data: members, error: membersError } = await supabaseAdmin
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  if (membersError) {
    throw new AppError('Error obteniendo miembros del grupo', 500);
  }

  const memberIds = members?.map(m => m.user_id) || [];

  // Eliminar el grupo (las foreign keys deberían manejar las cascadas)
  const { error: deleteError } = await supabaseAdmin
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (deleteError) {
    throw new AppError('Error eliminando grupo: ' + deleteError.message, 500);
  }

  // Actualizar contador de grupos de todos los miembros
  if (memberIds.length > 0) {
    // Para cada miembro, obtener su contador actual y decrementar
    for (const memberId of memberIds) {
      const { data: member, error: memberError } = await supabaseAdmin
        .from('users')
        .select('total_groups')
        .eq('id', memberId)
        .single();

      if (!memberError && member) {
        await supabaseAdmin
          .from('users')
          .update({
            total_groups: (member.total_groups || 0) - 1
          })
          .eq('id', memberId);
      }
    }
  }

  res.json({
    success: true,
    message: 'Grupo eliminado exitosamente'
  });
}));

// @route   GET /api/groups/:id/sessions
// @desc    Obtener sesiones de un grupo específico
// @access  Private (solo miembros del grupo)
router.get('/:id/sessions', asyncHandler(async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user.id;

  // Verificar que el usuario es miembro del grupo
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('role, status')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (memberError || !membership) {
    throw createForbiddenError('No tienes acceso a este grupo');
  }

  // Obtener sesiones del grupo
  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from('sessions')
    .select(`
      id, title, description, scheduled_date, duration, status,
      location_type, location_details, location_room, platform,
      max_attendees, organizer_id, group_id, type,
      created_at, updated_at,
      organizer:organizer_id (id, name, avatar),
      attendee_count:session_attendance(count)
    `)
    .eq('group_id', groupId)
    .order('scheduled_date', { ascending: true });

  if (sessionsError) {
    throw new AppError('Error obteniendo sesiones del grupo: ' + sessionsError.message, 500);
  }

  // Formatear las sesiones para incluir el conteo de asistentes
  const formattedSessions = sessions?.map(session => ({
    ...session,
    attendees: session.attendee_count || 0
  })) || [];

  res.json({
    success: true,
    data: {
      sessions: formattedSessions,
      count: formattedSessions.length
    }
  });
}));

// @route   GET /api/groups/:groupId/messages
// @desc    Obtener mensajes de un grupo
// @access  Private (miembros del grupo o administradores)
router.get('/:groupId/messages', [
  param('groupId').isUUID().withMessage('ID de grupo inválido'),
  query('before').optional().isISO8601().withMessage('Fecha inválida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe ser entre 1 y 100')
], auth, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros inválidos', errors.array());
  }

  const { groupId } = req.params;
  const { before = new Date().toISOString(), limit = 50 } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Los administradores tienen acceso a todos los grupos
  if (userRole !== 'admin') {
    // Verificar que el usuario es miembro del grupo
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      throw createForbiddenError('No tienes permiso para ver los mensajes de este grupo');
    }
  }

  // Obtener mensajes
  let query = supabaseAdmin
    .from('messages')
    .select(`
      id, 
      content, 
      created_at,
      updated_at,
      status,
      sender_id,
      sender:users!inner(id, name, avatar, email)
    `, { count: 'exact' })
    .eq('group_id', groupId)
    .lt('created_at', before)
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  const { data: messages, error, count } = await query;

  if (error) {
    throw new AppError('Error al cargar los mensajes', 500);
  }

  // Marcar mensajes como leídos (solo si no es admin o si es miembro)
  if (messages.length > 0 && userRole !== 'admin') {
    const messageIds = messages
      .filter(msg => msg.status !== 'read' && msg.sender_id !== userId)
      .map(msg => msg.id);

    if (messageIds.length > 0) {
      await supabaseAdmin
        .from('messages')
        .update({ status: 'read' })
        .in('id', messageIds);
    }
  }

  res.json({
    success: true,
    data: {
      messages: messages.reverse(), // Ordenar del más antiguo al más reciente
      total: count || 0
    }
  });
}));

// @route   POST /api/groups/:groupId/messages
// @desc    Enviar un mensaje al grupo
// @access  Private (miembros del grupo o administradores)
router.post('/:groupId/messages', [
  param('groupId').isUUID().withMessage('ID de grupo inválido'),
  body('content')
    .trim()
    .notEmpty().withMessage('El mensaje no puede estar vacío')
    .isLength({ max: 2000 }).withMessage('El mensaje no puede tener más de 2000 caracteres')
], auth, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const { groupId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Los administradores pueden enviar mensajes a todos los grupos
  if (userRole !== 'admin') {
    // Verificar que el usuario es miembro activo del grupo
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('id, status')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership || membership.status !== 'active') {
      throw createForbiddenError('No tienes permiso para enviar mensajes en este grupo');
    }
  }

  // Crear el mensaje
  const { data: message, error: messageError } = await supabaseAdmin
    .from('messages')
    .insert([
      {
        content,
        group_id: groupId,
        sender_id: userId,
        status: 'sent'
      }
    ])
    .select(`
      id, 
      content, 
      created_at,
      updated_at,
      status,
      sender_id,
      sender:users!inner(id, name, avatar, email)
    `)
    .single();

  if (messageError || !message) {
    throw new AppError('Error al enviar el mensaje', 500);
  }

  // Actualizar última actividad del grupo
  await supabaseAdmin
    .from('groups')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', groupId);

  // Emitir evento de nuevo mensaje (si usas WebSockets)
  if (req.io) {
    req.io.to(`group:${groupId}`).emit('newMessage', {
      ...message,
      group_id: groupId
    });
  }

  res.status(201).json({
    success: true,
    data: message
  });
}));

// @route   PUT /api/groups/:groupId/messages/:messageId
// @desc    Actualizar un mensaje
// @access  Private (solo el autor o admin del grupo)
router.put('/:groupId/messages/:messageId', [
  param('groupId').isUUID().withMessage('ID de grupo inválido'),
  param('messageId').isUUID().withMessage('ID de mensaje inválido'),
  body('content')
    .trim()
    .notEmpty().withMessage('El mensaje no puede estar vacío')
    .isLength({ max: 2000 }).withMessage('El mensaje no puede tener más de 2000 caracteres')
], auth, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const { groupId, messageId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  // Verificar que el mensaje existe y pertenece al grupo
  const { data: message, error: messageError } = await supabaseAdmin
    .from('messages')
    .select('id, sender_id, created_at')
    .eq('id', messageId)
    .eq('group_id', groupId)
    .single();

  if (messageError || !message) {
    throw createNotFoundError('Mensaje no encontrado');
  }

  // Verificar permisos (solo el autor o admin puede editar)
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  const isAuthor = message.sender_id === userId;
  const isAdmin = membership?.role === 'admin' || membership?.role === 'moderator';

  if (!isAuthor && !isAdmin) {
    throw createForbiddenError('No tienes permiso para editar este mensaje');
  }

  // Verificar límite de tiempo (solo permitir edición durante 15 minutos)
  const messageAge = (new Date() - new Date(message.created_at)) / (1000 * 60); // en minutos
  if (messageAge > 15 && !isAdmin) {
    throw createForbiddenError('El mensaje solo puede ser editado durante los primeros 15 minutos');
  }

  // Actualizar mensaje
  const { data: updatedMessage, error: updateError } = await supabaseAdmin
    .from('messages')
    .update({
      content,
      updated_at: new Date().toISOString(),
      is_edited: true
    })
    .eq('id', messageId)
    .select(`
      id, 
      content, 
      created_at,
      updated_at,
      status,
      sender_id,
      is_edited,
      sender:users!inner(id, name, avatar, email)
    `)
    .single();

  if (updateError || !updatedMessage) {
    throw new AppError('Error al actualizar el mensaje', 500);
  }

  // Emitir evento de actualización (si usas WebSockets)
  if (req.io) {
    req.io.to(`group:${groupId}`).emit('messageUpdated', {
      ...updatedMessage,
      group_id: groupId,
      groupId
    });
  }

  res.json({
    success: true,
    data: updatedMessage
  });
}));

// @route   DELETE /api/groups/:groupId/messages/:messageId
// @desc    Eliminar un mensaje
// @access  Private (solo el autor o admin del grupo)
router.delete('/:groupId/messages/:messageId', [
  param('groupId').isUUID().withMessage('ID de grupo inválido'),
  param('messageId').isUUID().withMessage('ID de mensaje inválido')
], auth, asyncHandler(async (req, res) => {
  const { groupId, messageId } = req.params;
  const userId = req.user.id;

  // Verificar que el mensaje existe y pertenece al grupo
  const { data: message, error: messageError } = await supabaseAdmin
    .from('messages')
    .select('id, sender_id')
    .eq('id', messageId)
    .eq('group_id', groupId)
    .single();

  if (messageError || !message) {
    throw createNotFoundError('Mensaje no encontrado');
  }

  // Verificar permisos (solo el autor o admin puede eliminar)
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  const isAuthor = message.sender_id === userId;
  const isAdmin = membership?.role === 'admin' || membership?.role === 'moderator';

  if (!isAuthor && !isAdmin) {
    throw createForbiddenError('No tienes permiso para eliminar este mensaje');
  }

  // Eliminar mensaje (en producción, podrías hacer un soft delete)
  const { error: deleteError } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (deleteError) {
    throw new AppError('Error al eliminar el mensaje', 500);
  }

  // Emitir evento de eliminación (si usas WebSockets)
  if (req.io) {
    req.io.to(`group:${groupId}`).emit('messageDeleted', {
      messageId,
      groupId
    });
  }

  res.json({
    success: true,
    data: { id: messageId }
  });
}));

// @route   POST /api/groups/:groupId/messages/read
// @desc    Marcar mensajes como leídos
// @access  Private (miembros del grupo o administradores)
router.post('/:groupId/messages/read', [
  param('groupId').isUUID().withMessage('ID de grupo inválido'),
  body('messageIds')
    .isArray({ min: 1 }).withMessage('Se requiere al menos un ID de mensaje')
    .custom(ids => ids.every(id => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)))
    .withMessage('IDs de mensaje inválidos')
], auth, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const { groupId } = req.params;
  const { messageIds } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Los administradores tienen acceso a todos los grupos
  if (userRole !== 'admin') {
    // Verificar que el usuario es miembro del grupo
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      throw createForbiddenError('No eres miembro de este grupo');
    }
  }

  // Actualizar estado de los mensajes a 'read'
  const { error: updateError } = await supabaseAdmin
    .from('messages')
    .update({ status: 'read' })
    .in('id', messageIds)
    .eq('group_id', groupId)
    .neq('sender_id', userId); // No marcar como leídos los mensajes propios

  if (updateError) {
    throw new AppError('Error al actualizar el estado de los mensajes', 500);
  }

  res.json({
    success: true,
    data: {
      updated: messageIds.length
    }
  });
}));

// @route   GET /api/groups/:id/pending-members
// @desc    Obtener solicitudes pendientes de un grupo (solo admins/moderadores)
// @access  Private
router.get('/:id/pending-members', [
  param('id').isUUID().withMessage('ID de grupo inválido')
], auth, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros inválidos', errors.array());
  }

  const groupId = req.params.id;
  const userId = req.user.id;

  // Verificar que el usuario es admin o moderador del grupo
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (membershipError || !membership || !['admin', 'moderator'].includes(membership.role)) {
    throw createForbiddenError('No tienes permiso para ver las solicitudes pendientes');
  }

  // Obtener miembros con status 'pending'
  const { data: pendingMembers, error: pendingError } = await supabaseAdmin
    .from('group_members')
    .select(`
      id,
      user_id,
      role,
      status,
      joined_at,
      user:users!inner(
        id, 
        name, 
        avatar, 
        email, 
        level, 
        total_sessions,
        university,
        career,
        semester,
        study_hours,
        xp,
        last_active
      )
    `)
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('joined_at', { ascending: true });

  if (pendingError) {
    throw new AppError('Error obteniendo solicitudes pendientes: ' + pendingError.message, 500);
  }

  res.json({
    success: true,
    data: {
      pendingMembers: pendingMembers || [],
      count: pendingMembers?.length || 0
    }
  });
}));

// @route   POST /api/groups/:id/members/:memberId/approve
// @desc    Aprobar una solicitud de membresía (solo admins/moderadores)
// @access  Private
router.post('/:id/members/:memberId/approve', [
  param('id').isUUID().withMessage('ID de grupo inválido'),
  param('memberId').isUUID().withMessage('ID de miembro inválido')
], auth, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros inválidos', errors.array());
  }

  const groupId = req.params.id;
  const memberId = req.params.memberId;
  const userId = req.user.id;

  // Verificar que el usuario es admin o moderador del grupo
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (membershipError || !membership || !['admin', 'moderator'].includes(membership.role)) {
    throw createForbiddenError('No tienes permiso para aprobar solicitudes');
  }

  // Verificar que el miembro existe y está pendiente
  const { data: pendingMember, error: pendingError } = await supabaseAdmin
    .from('group_members')
    .select('id, user_id, status, group_id')
    .eq('id', memberId)
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .single();

  if (pendingError || !pendingMember) {
    throw createNotFoundError('Solicitud pendiente no encontrada');
  }

  // Verificar límite de miembros
  const { data: activeMembers, error: countError } = await supabaseAdmin
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('status', 'active');

  const { data: group, error: groupError } = await supabaseAdmin
    .from('groups')
    .select('max_members')
    .eq('id', groupId)
    .single();

  if (groupError) {
    throw new AppError('Error obteniendo información del grupo', 500);
  }

  if (activeMembers && activeMembers.length >= group.max_members) {
    throw createValidationError('El grupo ha alcanzado su límite de miembros');
  }

  // Obtener información del grupo y usuario para la notificación
  const { data: groupInfo, error: groupInfoError } = await supabaseAdmin
    .from('groups')
    .select('id, name')
    .eq('id', groupId)
    .single();

  // Aprobar la solicitud
  const { error: updateError } = await supabaseAdmin
    .from('group_members')
    .update({ status: 'active' })
    .eq('id', memberId);

  if (updateError) {
    throw new AppError('Error aprobando la solicitud: ' + updateError.message, 500);
  }

  // Actualizar contador de grupos del usuario
  const { data: currentUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('total_groups')
    .eq('id', pendingMember.user_id)
    .single();

  if (!userError && currentUser) {
    await supabaseAdmin
      .from('users')
      .update({ total_groups: (currentUser.total_groups || 0) + 1 })
      .eq('id', pendingMember.user_id);
  }

  // Actualizar last_activity del grupo
  await supabaseAdmin
    .from('groups')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', groupId);

  // Notificar al usuario sobre la aprobación
  if (groupInfo) {
    await supabaseAdmin.from('notifications').insert([{
      user_id: pendingMember.user_id,
      type: 'system',
      title: 'Solicitud aprobada',
      message: `Tu solicitud para unirte al grupo "${groupInfo.name}" fue aprobada. ¡Bienvenido!`,
      related_group_id: groupId,
      metadata: {
        request_type: 'group_join_approved'
      },
      action_url: `/user/panel?group=${groupId}`
    }]);
  }

  res.json({
    success: true,
    message: 'Solicitud aprobada exitosamente'
  });
}));

// @route   POST /api/groups/:id/members/:memberId/reject
// @desc    Rechazar una solicitud de membresía (solo admins/moderadores)
// @access  Private
router.post('/:id/members/:memberId/reject', [
  param('id').isUUID().withMessage('ID de grupo inválido'),
  param('memberId').isUUID().withMessage('ID de miembro inválido')
], auth, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros inválidos', errors.array());
  }

  const groupId = req.params.id;
  const memberId = req.params.memberId;
  const userId = req.user.id;

  // Verificar que el usuario es admin o moderador del grupo
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (membershipError || !membership || !['admin', 'moderator'].includes(membership.role)) {
    throw createForbiddenError('No tienes permiso para rechazar solicitudes');
  }

  // Verificar que el miembro existe y está pendiente
  const { data: pendingMember, error: pendingError } = await supabaseAdmin
    .from('group_members')
    .select('id, status, group_id, user_id')
    .eq('id', memberId)
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .single();

  if (pendingError || !pendingMember) {
    throw createNotFoundError('Solicitud pendiente no encontrada');
  }

  // Obtener información del grupo para la notificación
  const { data: groupInfo, error: groupInfoError } = await supabaseAdmin
    .from('groups')
    .select('id, name')
    .eq('id', groupId)
    .single();

  const groupName = groupInfo?.name || 'el grupo';

  // Rechazar la solicitud (eliminar el registro)
  const { error: deleteError } = await supabaseAdmin
    .from('group_members')
    .delete()
    .eq('id', memberId);

  if (deleteError) {
    throw new AppError('Error rechazando la solicitud: ' + deleteError.message, 500);
  }

  // Notificar al usuario sobre el rechazo
  if (pendingMember.user_id) {
    try {
      await supabaseAdmin.from('notifications').insert([{
        user_id: pendingMember.user_id,
        type: 'system',
        title: 'Solicitud rechazada',
        message: `Tu solicitud para unirte al grupo "${groupName}" fue rechazada.`,
        related_group_id: groupId,
        metadata: {
          request_type: 'group_join_rejected'
        }
      }]);
    } catch (notificationError) {
      // No fallar la solicitud si la notificación falla

    }
  }

  res.json({
    success: true,
    message: 'Solicitud rechazada exitosamente'
  });
}));

// @route   GET /api/groups/by-invite-code/:code
// @desc    Buscar grupo por código de invitación
// @access  Private
router.get('/by-invite-code/:code', [
  param('code').trim().isLength({ min: 6, max: 10 }).withMessage('Código de invitación inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Código de invitación inválido', errors.array());
  }

  const inviteCode = req.params.code.toUpperCase();
  const userId = req.user.id;

  // Buscar grupo por código de invitación
  const { data: group, error: groupError } = await supabaseAdmin
    .from('groups')
    .select(`
      id, name, description, subject, university, career, semester,
      color, max_members, is_private, progress, status, last_activity,
      creator_id, total_sessions, total_hours, average_rating, require_approval,
      invite_code,
      creator:creator_id (id, name, avatar)
    `)
    .eq('invite_code', inviteCode)
    .eq('status', 'active')
    .single();

  if (groupError || !group) {
    throw createNotFoundError('Grupo no encontrado con ese código de invitación');
  }

  // Obtener conteo de miembros activos
  const { data: memberData, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('status', 'active');

  const memberCount = memberData ? memberData.length : 0;

  // Verificar si el usuario ya es miembro
  const { data: userMembership, error: membershipError } = await supabaseAdmin
    .from('group_members')
    .select('id, status, role')
    .eq('group_id', group.id)
    .eq('user_id', userId)
    .single();

  const isMember = userMembership?.status === 'active';
  const isPending = userMembership?.status === 'pending';

  res.json({
    success: true,
    data: {
      group: {
        ...group,
        member_count: memberCount,
        is_member: isMember,
        is_pending: isPending,
        userRole: userMembership?.role || null
      }
    }
  });
}));

module.exports = router;
