const express = require('express');
const { query, body, param, validationResult } = require('express-validator');
const {
  asyncHandler,
  createValidationError,
  createNotFoundError,
  AppError,
} = require('../middleware/errorHandler');
const { supabaseAdmin, pool } = require('../config/database');

const router = express.Router();

const parseValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }
};

// Función helper para construir WHERE clause desde buildQuery
const buildWhereClause = async (table, buildQuery) => {
  if (!buildQuery || typeof buildQuery !== 'function') {
    return { where: '', params: [], paramIndex: 1 };
  }

  try {
    // Crear un query builder temporal para extraer los filtros
    const tempBuilder = supabaseAdmin.from(table);

    // Aplicar buildQuery para obtener los filtros
    const modifiedQuery = buildQuery(tempBuilder);

    // Intentar obtener la query string de Supabase
    // Como no podemos obtener directamente la query SQL de Supabase,
    // vamos a usar un enfoque diferente: obtener los datos filtrados y contar
    return null; // Retornar null para indicar que debemos usar Supabase
  } catch (error) {

    return null;
  }
};

const getCount = async (table, buildQuery) => {
  try {
    // Crear query builder
    let queryBuilder = supabaseAdmin.from(table);

    if (!queryBuilder) {

      return 0;
    }

    // Aplicar filtros si existen
    if (typeof buildQuery === 'function') {
      try {
        const modifiedQuery = buildQuery(queryBuilder);
        // buildQuery debe retornar el query builder modificado
        if (modifiedQuery && typeof modifiedQuery.select === 'function') {
          queryBuilder = modifiedQuery;
        } else if (modifiedQuery === undefined || modifiedQuery === null) {
          // Si no retorna nada, el queryBuilder fue modificado por referencia
          // Continuar con el queryBuilder original
        }
      } catch (buildError) {

        // Si buildQuery falla, crear un nuevo query builder sin filtros
        queryBuilder = supabaseAdmin.from(table);
      }
    }

    // Método 1: Intentar con Supabase count exact (más eficiente)
    try {
      const { count, error } = await queryBuilder
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null && count !== undefined && typeof count === 'number') {

        return Number(count);
      }

      if (error) {

      } else if (count === null) {

        return 0;
      }
    } catch (supabaseError) {

    }

    // Método 2: Obtener datos filtrados y contar manualmente (más confiable)
    // Recrear el query builder con los mismos filtros
    let altQueryBuilder = supabaseAdmin.from(table);

    // Aplicar los mismos filtros si existen
    if (typeof buildQuery === 'function') {
      try {
        const modifiedAltQuery = buildQuery(altQueryBuilder);
        if (modifiedAltQuery && typeof modifiedAltQuery.select === 'function') {
          altQueryBuilder = modifiedAltQuery;
        }
      } catch (buildError) {

        // Si falla, usar query builder sin filtros
      }
    }

    // Obtener solo el campo id para minimizar datos transferidos
    const { data, error } = await altQueryBuilder.select('id').limit(10000);

    if (error) {

      return 0;
    }

    const result = data ? data.length : 0;

    return result;
  } catch (error) {

    return 0;
  }
};

const safeGetCount = async (table, buildQuery) => {
  try {
    const count = await getCount(table, buildQuery);
    const queryDesc = buildQuery ? 'with filter' : 'without filter';

    return count;
  } catch (error) {


    // Retornar 0 en caso de error para no romper el dashboard
    return 0;
  }
};

// GET /api/admin/dashboard
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 7);
    const todayISOString = now.toISOString();
    const last7DaysISOString = last7Days.toISOString();

    // Función helper para obtener todos los datos de una tabla
    const getAllData = async (table, selectFields = '*') => {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select(selectFields);

        if (error) {

          return [];
        }

        return data || [];
      } catch (error) {

        return [];
      }
    };



    // Obtener todos los datos necesarios en paralelo
    const [
      allUsers,
      allGroups,
      allSessions,
      allFiles,
      allForums,
      allFileDownloads,
    ] = await Promise.all([
      getAllData('users', 'id, is_active, created_at'),
      getAllData('groups', 'id, status, created_at'),
      getAllData('sessions', 'id, scheduled_date'),
      getAllData('files', 'id, is_public, resource_type'),
      getAllData('forums', 'id'),
      getAllData('file_downloads', 'id'),
    ]);



    // Calcular conteos de usuarios
    const totalUsers = allUsers.length;
    const activeUsersTrue = allUsers.filter(u => u.is_active === true).length;
    const activeUsersNull = allUsers.filter(u => u.is_active === null || u.is_active === undefined).length;
    const inactiveUsers = allUsers.filter(u => u.is_active === false).length;
    const activeUsers = activeUsersTrue + activeUsersNull; // Combinar activos (true + null)
    const newUsersLast7Days = allUsers.filter(u => {
      if (!u.created_at) return false;
      return new Date(u.created_at) >= last7Days;
    }).length;

    // Calcular conteos de grupos
    const totalGroups = allGroups.length;
    const activeGroups = allGroups.filter(g => g.status === 'active').length;
    const pendingGroups = allGroups.filter(g => g.status === 'pending').length;

    // Calcular conteos de sesiones
    const totalSessions = allSessions.length;
    const upcomingSessions = allSessions.filter(s => {
      if (!s.scheduled_date) return false;
      return new Date(s.scheduled_date) >= now;
    }).length;
    const pastSessions = allSessions.filter(s => {
      if (!s.scheduled_date) return false;
      return new Date(s.scheduled_date) < now;
    }).length;

    // Calcular conteos de recursos (files)
    const totalResources = allFiles.length;
    const publicResources = allFiles.filter(f => f.is_public === true).length;
    const privateResources = allFiles.filter(f => f.is_public === false || f.is_public === null).length;

    // Calcular recursos por tipo
    const resourcesByType = {};
    allFiles.forEach(file => {
      const type = file.resource_type || 'other';
      resourcesByType[type] = (resourcesByType[type] || 0) + 1;
    });

    // Calcular conteos de foros
    const totalForums = allForums.length;

    // Calcular total de descargas
    const totalDownloads = allFileDownloads.length;



    // Obtener datos recientes para mostrar en el dashboard
    const safeQuery = async (queryFn, defaultValue = []) => {
      try {
        const result = await queryFn();
        return result || defaultValue;
      } catch (error) {

        return defaultValue;
      }
    };

    const recentUsers = await safeQuery(async () => {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(
          `
        id,
        name,
        email,
        role,
        is_active,
        created_at,
        last_active,
        university,
        career,
        total_sessions,
        total_groups
      `,
        )
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    }, []);


    const recentGroups = await safeQuery(async () => {
      const { data, error } = await supabaseAdmin
        .from('groups')
        .select(
          `
        id,
        name,
        subject,
        status,
        created_at,
        color,
        creator_id,
        last_activity
      `,
        )
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data || [];
    }, []);

    // Calcular member_count para cada grupo
    if (recentGroups && recentGroups.length > 0) {
      try {
        const groupIds = recentGroups.map((g) => g.id);
        const { data: memberCounts, error: countError } = await supabaseAdmin
          .from('group_members')
          .select('group_id')
          .in('group_id', groupIds)
          .eq('status', 'active');

        if (!countError && memberCounts) {
          const countsMap = {};
          memberCounts.forEach((member) => {
            countsMap[member.group_id] = (countsMap[member.group_id] || 0) + 1;
          });

          recentGroups.forEach((group) => {
            group.member_count = countsMap[group.id] || 0;
          });
        }
      } catch (error) {

        // Continuar sin member_count
      }
    }

    const upcomingSessionsList = await safeQuery(async () => {
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .select(
          `
        id,
        title,
        scheduled_date,
        duration,
        status,
        group_id,
        created_at
      `,
        )
        .gte('scheduled_date', todayISOString)
        .order('scheduled_date', { ascending: true })
        .limit(6);
      if (error) throw error;
      return data || [];
    }, []);

    const latestActivity = await safeQuery(async () => {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select(
          `
        id,
        title,
        message,
        type,
        user_id,
        created_at,
        is_read
      `,
        )
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    }, []);

    // Preparar datos del resumen con los cálculos realizados
    const summariesData = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        newLast7Days: newUsersLast7Days,
      },
      groups: {
        total: totalGroups,
        active: activeGroups,
        pending: pendingGroups,
      },
      sessions: {
        total: totalSessions,
        upcoming: upcomingSessions,
        past: pastSessions,
      },
      resources: {
        total: totalResources,
        public: publicResources,
        private: privateResources,
      },
      forums: {
        total: totalForums,
      },
    };



    res.json({
      success: true,
      data: {
        summaries: summariesData,
        recentUsers: Array.isArray(recentUsers) ? recentUsers : [],
        recentGroups: Array.isArray(recentGroups) ? recentGroups : [],
        upcomingSessions: Array.isArray(upcomingSessionsList) ? upcomingSessionsList : [],
        latestActivity: Array.isArray(latestActivity) ? latestActivity : [],
      },
    });
  }),
);

// GET /api/admin/users
router.get(
  '/users',
  [
    query('search').optional().isString().trim().isLength({ min: 2, max: 100 }),
    query('status').optional().isIn(['active', 'inactive']),
    query('role').optional().isIn(['admin', 'student', 'mentor']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
  ],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const {
      search = '',
      status,
      role,
      limit = 20,
      page = 1,
      orderBy = 'created_at',
      order = 'desc',
    } = req.query;

    const sanitizedLimit = parseInt(limit, 10);
    const sanitizedPage = parseInt(page, 10);
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    let queryBuilder = supabaseAdmin
      .from('users')
      .select(
        `
        id,
        name,
        email,
        role,
        is_active,
        created_at,
        last_active,
        university,
        career,
        total_sessions,
        total_groups,
        level,
        xp,
        streak
      `,
        { count: 'exact' },
      )
      .range(offset, offset + sanitizedLimit - 1);

    if (search) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,university.ilike.%${search}%,career.ilike.%${search}%`,
      );
    }

    if (status === 'active') {
      queryBuilder = queryBuilder.eq('is_active', true);
    } else if (status === 'inactive') {
      queryBuilder = queryBuilder.eq('is_active', false);
    }

    if (role) {
      queryBuilder = queryBuilder.eq('role', role);
    }

    const orderDirection = order === 'asc' ? { ascending: true } : { ascending: false };
    queryBuilder = queryBuilder.order(orderBy, orderDirection);

    const { data: users, error, count } = await queryBuilder;

    if (error) {
      throw new AppError('Error obteniendo usuarios: ' + error.message, 500);
    }

    res.json({
      success: true,
      data: {
        users,
        total: count || 0,
        pagination: {
          limit: sanitizedLimit,
          page: sanitizedPage,
          pages: count ? Math.ceil(count / sanitizedLimit) : 0,
        },
      },
    });
  }),
);

// PATCH /api/admin/users/:id/status
router.patch(
  '/users/:id/status',
  [
    param('id').isUUID().withMessage('ID de usuario inválido'),
    body('is_active').isBoolean().withMessage('is_active debe ser booleano'),
  ],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const { id } = req.params;
    const { is_active } = req.body;

    // Primero verificar que el usuario existe
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      throw createNotFoundError('Usuario no encontrado');
    }

    // Obtener el estado actual del usuario antes de actualizar
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('is_active')
      .eq('id', id)
      .single();

    // Actualizar el estado del usuario
    const updateData = {
      is_active,
    };

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        id,
        name,
        email,
        role,
        is_active
      `,
      )
      .single();

    if (error || !user) {
      throw new AppError('Error actualizando usuario: ' + (error?.message || 'Error desconocido'), 500);
    }

    // Si el usuario está siendo desactivado, invalidar todos sus tokens
    if (!is_active && currentUser?.is_active !== false) {
      try {
        const TokenBlacklistService = require('../services/tokenBlacklistService');
        await TokenBlacklistService.invalidateUserOnDeactivation(id);
        await TokenBlacklistService.blacklistAllUserTokens(id, 'account_deactivated');

        // También revocar refresh tokens si es posible
        const RefreshTokenService = require('../services/refreshTokenService');
        await RefreshTokenService.revokeAllUserTokens(id);
      } catch (tokenError) {
        // Log del error pero no fallar la operación

      }
    }

    res.json({
      success: true,
      message: `Usuario ${is_active ? 'reactivado' : 'desactivado'} correctamente`,
      data: { user },
    });
  }),
);

// GET /api/admin/groups
router.get(
  '/groups',
  [
    query('status').optional().isString(),
    query('subject').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
  ],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const {
      status,
      subject,
      limit = 20,
      page = 1,
      order = 'desc',
      orderBy = 'created_at',
    } = req.query;

    const sanitizedLimit = parseInt(limit, 10);
    const sanitizedPage = parseInt(page, 10);
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    let queryBuilder = supabaseAdmin
      .from('groups')
      .select(
        `
        id,
        name,
        subject,
        status,
        created_at,
        creator_id,
        last_activity,
        is_private
      `,
        { count: 'exact' },
      )
      .range(offset, offset + sanitizedLimit - 1);

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    if (subject) {
      queryBuilder = queryBuilder.ilike('subject', `%${subject}%`);
    }

    queryBuilder = queryBuilder.order(orderBy, {
      ascending: order === 'asc',
    });

    const { data: groups, count, error } = await queryBuilder;

    if (error) {
      throw new AppError('Error obteniendo grupos: ' + error.message, 500);
    }

    // Calcular member_count para cada grupo
    if (groups && groups.length > 0) {
      const groupIds = groups.map((g) => g.id);
      const { data: memberCounts, error: countError } = await supabaseAdmin
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds)
        .eq('status', 'active');

      if (!countError && memberCounts) {
        const countsMap = {};
        memberCounts.forEach((member) => {
          countsMap[member.group_id] = (countsMap[member.group_id] || 0) + 1;
        });

        groups.forEach((group) => {
          group.member_count = countsMap[group.id] || 0;
        });
      }
    }

    res.json({
      success: true,
      data: {
        groups,
        total: count || 0,
        pagination: {
          limit: sanitizedLimit,
          page: sanitizedPage,
          pages: count ? Math.ceil(count / sanitizedLimit) : 0,
        },
      },
    });
  }),
);

// GET /api/admin/groups/:id/members
router.get(
  '/groups/:id/members',
  [param('id').isUUID().withMessage('ID de grupo inválido')],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const { id: groupId } = req.params;

    // Verificar que el grupo existe
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      throw createNotFoundError('Grupo no encontrado');
    }

    // Obtener miembros del grupo
    const { data: members, error: membersError } = await supabaseAdmin
      .from('group_members')
      .select(`
        id,
        role,
        status,
        joined_at,
        user:user_id (
          id,
          name,
          avatar,
          email,
          university,
          career,
          semester,
          level,
          total_sessions,
          is_active
        )
      `)
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });

    if (membersError) {
      throw new AppError('Error obteniendo miembros: ' + membersError.message, 500);
    }

    res.json({
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
        },
        members: (members || []).map((member) => ({
          id: member.id,
          role: member.role,
          status: member.status,
          joined_at: member.joined_at,
          user: member.user,
        })),
        total: members?.length || 0,
      },
    });
  }),
);

// PATCH /api/admin/groups/:id/status
router.patch(
  '/groups/:id/status',
  [
    param('id').isUUID().withMessage('ID de grupo inválido'),
    body('status').isIn(['active', 'inactive', 'archived', 'pending']).withMessage('Estado inválido'),
  ],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const { id } = req.params;
    const { status } = req.body;

    // Verificar que el grupo existe
    const { data: existingGroup, error: fetchError } = await supabaseAdmin
      .from('groups')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingGroup) {
      throw createNotFoundError('Grupo no encontrado');
    }

    // Actualizar solo el estado
    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .update({ status })
      .eq('id', id)
      .select('id, name, status, created_at')
      .single();

    if (error) {
      throw new AppError('Error actualizando estado del grupo: ' + error.message, 500);
    }

    res.json({
      success: true,
      message: `Grupo ${status === 'active' ? 'activado' : status === 'inactive' ? 'desactivado' : 'actualizado'} exitosamente`,
      data: { group },
    });
  }),
);

// GET /api/admin/sessions
router.get(
  '/sessions',
  [
    query('status').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
  ],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const {
      status,
      limit = 20,
      page = 1,
      order = 'desc',
      orderBy = 'scheduled_date',
    } = req.query;

    const sanitizedLimit = parseInt(limit, 10);
    const sanitizedPage = parseInt(page, 10);
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    let queryBuilder = supabaseAdmin
      .from('sessions')
      .select(
        `
        id,
        title,
        status,
        scheduled_date,
        duration,
        group_id,
        created_at
      `,
        { count: 'exact' },
      )
      .range(offset, offset + sanitizedLimit - 1);

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    queryBuilder = queryBuilder.order(orderBy, {
      ascending: order === 'asc',
    });

    const { data: sessions, count, error } = await queryBuilder;

    if (error) {
      throw new AppError('Error obteniendo sesiones: ' + error.message, 500);
    }

    // Calcular attendance_count para cada sesión (opcional)
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id);
      const { data: attendanceCounts, error: countError } = await supabaseAdmin
        .from('session_attendance')
        .select('session_id')
        .in('session_id', sessionIds)
        .eq('status', 'confirmed');

      if (!countError && attendanceCounts) {
        const countsMap = {};
        attendanceCounts.forEach((attendance) => {
          countsMap[attendance.session_id] = (countsMap[attendance.session_id] || 0) + 1;
        });

        sessions.forEach((session) => {
          session.attendance_count = countsMap[session.id] || 0;
        });
      }
    }

    res.json({
      success: true,
      data: {
        sessions,
        total: count || 0,
        pagination: {
          limit: sanitizedLimit,
          page: sanitizedPage,
          pages: count ? Math.ceil(count / sanitizedLimit) : 0,
        },
      },
    });
  }),
);

// GET /api/admin/resources
router.get(
  '/resources',
  [
    query('search').optional().isString().trim().isLength({ min: 1, max: 100 }),
    query('resource_type').optional().isIn(['guide', 'document', 'link', 'exercise', 'material_theory', 'video', 'tool', 'other']),
    query('is_public').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
  ],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const {
      search = '',
      resource_type,
      is_public,
      limit = 20,
      page = 1,
      orderBy = 'created_at',
      order = 'desc',
    } = req.query;

    const sanitizedLimit = parseInt(limit, 10);
    const sanitizedPage = parseInt(page, 10);
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    let queryBuilder = supabaseAdmin
      .from('files')
      .select(
        `
        id,
        name,
        original_name,
        mime_type,
        size,
        resource_type,
        is_public,
        download_count,
        created_at,
        uploaded_by,
        group_id,
        uploader:uploaded_by (
          id,
          name,
          email,
          avatar
        ),
        group:group_id (
          id,
          name,
          subject
        )
      `,
        { count: 'exact' },
      )
      .range(offset, offset + sanitizedLimit - 1);

    if (search) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${search}%,original_name.ilike.%${search}%`,
      );
    }

    if (resource_type) {
      queryBuilder = queryBuilder.eq('resource_type', resource_type);
    }

    if (is_public !== undefined) {
      queryBuilder = queryBuilder.eq('is_public', is_public === 'true' || is_public === true);
    }

    const orderDirection = order === 'asc' ? { ascending: true } : { ascending: false };
    queryBuilder = queryBuilder.order(orderBy, orderDirection);

    const { data: resources, error, count } = await queryBuilder;

    if (error) {
      throw new AppError('Error obteniendo recursos: ' + error.message, 500);
    }

    // Obtener estadísticas de descarga para cada recurso
    if (resources && resources.length > 0) {
      const resourceIds = resources.map((r) => r.id);
      const { data: downloadStats } = await supabaseAdmin
        .from('file_downloads')
        .select('file_id')
        .in('file_id', resourceIds);

      if (downloadStats) {
        const statsMap = {};
        downloadStats.forEach((stat) => {
          statsMap[stat.file_id] = (statsMap[stat.file_id] || 0) + 1;
        });

        resources.forEach((resource) => {
          resource.downloads = statsMap[resource.id] || 0;
        });
      }
    }

    res.json({
      success: true,
      data: {
        resources: resources || [],
        total: count || 0,
        pagination: {
          limit: sanitizedLimit,
          page: sanitizedPage,
          pages: count ? Math.ceil(count / sanitizedLimit) : 0,
        },
      },
    });
  }),
);

// DELETE /api/admin/resources/:id
router.delete(
  '/resources/:id',
  [param('id').isUUID().withMessage('ID de recurso inválido')],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const { id } = req.params;

    // Verificar que el recurso existe
    const { data: resource, error: findError } = await supabaseAdmin
      .from('files')
      .select('id, storage_path')
      .eq('id', id)
      .single();

    if (findError || !resource) {
      throw createNotFoundError('Recurso no encontrado');
    }

    // Eliminar registro de la base de datos
    const { error: deleteError } = await supabaseAdmin
      .from('files')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new AppError('Error eliminando recurso: ' + deleteError.message, 500);
    }

    // Intentar borrar archivo de storage (no fallar si no existe)
    if (resource.storage_path) {
      await supabaseAdmin.storage.from('resources').remove([resource.storage_path]);
    }

    res.json({
      success: true,
      message: 'Recurso eliminado exitosamente',
    });
  }),
);

// GET /api/admin/resources/stats
router.get(
  '/resources/stats',
  asyncHandler(async (req, res) => {
    // Obtener todos los datos necesarios
    const [filesResult, downloadsResult] = await Promise.all([
      supabaseAdmin.from('files').select('id, is_public, resource_type'),
      supabaseAdmin.from('file_downloads').select('id, file_id'),
    ]);

    // Manejar errores
    if (filesResult.error) {

      throw new AppError('Error obteniendo estadísticas de recursos', 500);
    }

    if (downloadsResult.error) {

      throw new AppError('Error obteniendo estadísticas de descargas', 500);
    }

    // Calcular estadísticas
    const filesData = filesResult.data || [];
    const downloadsData = downloadsResult.data || [];

    const totalResources = filesData.length;
    const publicResources = filesData.filter(f => f.is_public === true).length;
    const privateResources = filesData.filter(f => f.is_public === false || f.is_public === null).length;
    const totalDownloads = downloadsData.length;

    // Calcular recursos por tipo
    const resourcesByType = {};
    filesData.forEach(file => {
      const type = file.resource_type || 'other';
      resourcesByType[type] = (resourcesByType[type] || 0) + 1;
    });

    // Obtener recursos más descargados
    const { data: topDownloads } = await supabaseAdmin
      .from('file_downloads')
      .select('file_id')
      .limit(100);

    const downloadCounts = {};
    topDownloads?.forEach((download) => {
      downloadCounts[download.file_id] = (downloadCounts[download.file_id] || 0) + 1;
    });

    const topDownloadedIds = Object.entries(downloadCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    const { data: topResources } = await supabaseAdmin
      .from('files')
      .select('id, name, download_count, resource_type')
      .in('id', topDownloadedIds);

    res.json({
      success: true,
      data: {
        total: totalResources || 0,
        public: publicResources || 0,
        private: privateResources || 0,
        totalDownloads: totalDownloads || 0,
        byType: resourcesByType || {},
        topDownloaded: topResources || [],
      },
    });
  }),
);

// GET /api/admin/forums
router.get(
  '/forums',
  [
    query('search').optional().isString().trim().isLength({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'deleted', 'locked']),
    query('is_public').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
  ],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const {
      search = '',
      status = 'active',
      is_public,
      limit = 20,
      page = 1,
      orderBy = 'last_activity',
      order = 'desc',
    } = req.query;

    const sanitizedLimit = parseInt(limit, 10);
    const sanitizedPage = parseInt(page, 10);
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    let queryBuilder = supabaseAdmin
      .from('forums')
      .select(
        `
        id,
        title,
        description,
        status,
        is_public,
        is_locked,
        allow_replies,
        created_at,
        last_activity,
        creator_id,
        group_id,
        creator:creator_id (
          id,
          name,
          email,
          avatar
        ),
        group:group_id (
          id,
          name,
          subject
        )
      `,
        { count: 'exact' },
      )
      .range(offset, offset + sanitizedLimit - 1);

    if (search) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    if (is_public !== undefined) {
      queryBuilder = queryBuilder.eq('is_public', is_public === 'true' || is_public === true);
    }

    const orderDirection = order === 'asc' ? { ascending: true } : { ascending: false };
    queryBuilder = queryBuilder.order(orderBy, orderDirection);

    const { data: forums, error, count } = await queryBuilder;

    if (error) {
      throw new AppError('Error obteniendo foros: ' + error.message, 500);
    }

    // Obtener conteo de posts para cada foro
    if (forums && forums.length > 0) {
      const forumIds = forums.map((f) => f.id);
      const { data: postCounts } = await supabaseAdmin
        .from('forum_posts')
        .select('forum_id')
        .in('forum_id', forumIds)
        .eq('is_deleted', false);

      if (postCounts) {
        const countsMap = {};
        postCounts.forEach((post) => {
          countsMap[post.forum_id] = (countsMap[post.forum_id] || 0) + 1;
        });

        forums.forEach((forum) => {
          forum.post_count = countsMap[forum.id] || 0;
        });
      }
    }

    res.json({
      success: true,
      data: {
        forums: forums || [],
        total: count || 0,
        pagination: {
          limit: sanitizedLimit,
          page: sanitizedPage,
          pages: count ? Math.ceil(count / sanitizedLimit) : 0,
        },
      },
    });
  }),
);

// GET /api/admin/forums/:id/posts
router.get(
  '/forums/:id/posts',
  [
    param('id').isUUID().withMessage('ID de foro inválido'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
  ],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const { id } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const sanitizedLimit = parseInt(limit, 10);
    const sanitizedPage = parseInt(page, 10);
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    // Verificar que el foro existe
    const { data: forum, error: forumError } = await supabaseAdmin
      .from('forums')
      .select('id, title')
      .eq('id', id)
      .single();

    if (forumError || !forum) {
      throw createNotFoundError('Foro no encontrado');
    }

    // Obtener posts
    const { data: posts, error: postsError, count } = await supabaseAdmin
      .from('forum_posts')
      .select(
        `
        id,
        title,
        content,
        likes,
        views,
        is_pinned,
        is_deleted,
        created_at,
        author_id,
        author:author_id (
          id,
          name,
          email,
          avatar
        )
      `,
        { count: 'exact' },
      )
      .eq('forum_id', id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + sanitizedLimit - 1);

    if (postsError) {
      throw new AppError('Error obteniendo posts: ' + postsError.message, 500);
    }

    // Obtener conteo de respuestas para cada post
    if (posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const { data: replyCounts } = await supabaseAdmin
        .from('forum_replies')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_deleted', false);

      if (replyCounts) {
        const countsMap = {};
        replyCounts.forEach((reply) => {
          countsMap[reply.post_id] = (countsMap[reply.post_id] || 0) + 1;
        });

        posts.forEach((post) => {
          post.reply_count = countsMap[post.id] || 0;
        });
      }
    }

    res.json({
      success: true,
      data: {
        forum: {
          id: forum.id,
          title: forum.title,
        },
        posts: posts || [],
        total: count || 0,
        pagination: {
          limit: sanitizedLimit,
          page: sanitizedPage,
          pages: count ? Math.ceil(count / sanitizedLimit) : 0,
        },
      },
    });
  }),
);

// DELETE /api/admin/forums/:id
router.delete(
  '/forums/:id',
  [param('id').isUUID().withMessage('ID de foro inválido')],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const { id } = req.params;

    // Verificar que el foro existe
    const { data: forum, error: findError } = await supabaseAdmin
      .from('forums')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !forum) {
      throw createNotFoundError('Foro no encontrado');
    }

    // Soft delete
    const { error: deleteError } = await supabaseAdmin
      .from('forums')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (deleteError) {
      throw new AppError('Error eliminando foro: ' + deleteError.message, 500);
    }

    res.json({
      success: true,
      message: 'Foro eliminado exitosamente',
    });
  }),
);

// DELETE /api/admin/forums/posts/:postId
router.delete(
  '/forums/posts/:postId',
  [param('postId').isUUID().withMessage('ID de post inválido')],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const { postId } = req.params;

    // Verificar que el post existe
    const { data: post, error: findError } = await supabaseAdmin
      .from('forum_posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (findError || !post) {
      throw createNotFoundError('Post no encontrado');
    }

    // Soft delete
    const { error: deleteError } = await supabaseAdmin
      .from('forum_posts')
      .update({ is_deleted: true })
      .eq('id', postId);

    if (deleteError) {
      throw new AppError('Error eliminando post: ' + deleteError.message, 500);
    }

    res.json({
      success: true,
      message: 'Post eliminado exitosamente',
    });
  }),
);

// DELETE /api/admin/forums/replies/:replyId
router.delete(
  '/forums/replies/:replyId',
  [param('replyId').isUUID().withMessage('ID de respuesta inválido')],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const { replyId } = req.params;

    // Verificar que la respuesta existe
    const { data: reply, error: findError } = await supabaseAdmin
      .from('forum_replies')
      .select('id')
      .eq('id', replyId)
      .single();

    if (findError || !reply) {
      throw createNotFoundError('Respuesta no encontrada');
    }

    // Soft delete
    const { error: deleteError } = await supabaseAdmin
      .from('forum_replies')
      .update({ is_deleted: true })
      .eq('id', replyId);

    if (deleteError) {
      throw new AppError('Error eliminando respuesta: ' + deleteError.message, 500);
    }

    res.json({
      success: true,
      message: 'Respuesta eliminada exitosamente',
    });
  }),
);

// GET /api/admin/forums/stats
router.get(
  '/forums/stats',
  asyncHandler(async (req, res) => {
    // Obtener estadísticas generales de foros
    const [
      totalForums,
      activeForums,
      publicForums,
      privateForums,
      totalPosts,
      totalReplies,
    ] = await Promise.all([
      safeGetCount('forums'),
      safeGetCount('forums', (q) => q.eq('status', 'active')),
      safeGetCount('forums', (q) => q.eq('is_public', true).eq('status', 'active')),
      safeGetCount('forums', (q) => q.eq('is_public', false).eq('status', 'active')),
      safeGetCount('forum_posts', (q) => q.eq('is_deleted', false)),
      safeGetCount('forum_replies', (q) => q.eq('is_deleted', false)),
    ]);

    // Obtener foros más activos (con más posts)
    const { data: forumPosts } = await supabaseAdmin
      .from('forum_posts')
      .select('forum_id')
      .eq('is_deleted', false);

    const forumActivity = {};
    forumPosts?.forEach((post) => {
      forumActivity[post.forum_id] = (forumActivity[post.forum_id] || 0) + 1;
    });

    const topForumIds = Object.entries(forumActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    const { data: topForums } = await supabaseAdmin
      .from('forums')
      .select('id, title, last_activity')
      .in('id', topForumIds);

    res.json({
      success: true,
      data: {
        total: totalForums || 0,
        active: activeForums || 0,
        public: publicForums || 0,
        private: privateForums || 0,
        totalPosts: totalPosts || 0,
        totalReplies: totalReplies || 0,
        topActive: topForums || [],
      },
    });
  }),
);

// GET /api/admin/logs
router.get(
  '/logs',
  [
    query('type').optional().isString(),
    query('search').optional().isString().trim().isLength({ min: 1, max: 100 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('page').optional().isInt({ min: 1 }),
  ],
  asyncHandler(async (req, res) => {
    parseValidation(req);

    const {
      type,
      search = '',
      startDate,
      endDate,
      limit = 50,
      page = 1,
    } = req.query;

    const sanitizedLimit = parseInt(limit, 10);
    const sanitizedPage = parseInt(page, 10);
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    // Obtener logs de diferentes fuentes
    const logs = [];

    // 1. Logs de notificaciones (actividad del sistema)
    let notificationsQuery = supabaseAdmin
      .from('notifications')
      .select(
        `
        id,
        type,
        title,
        message,
        created_at,
        user_id,
        is_read,
        user:user_id (
          id,
          name,
          email
        )
      `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + sanitizedLimit - 1);

    if (type) {
      notificationsQuery = notificationsQuery.eq('type', type);
    }

    if (search) {
      notificationsQuery = notificationsQuery.or(
        `title.ilike.%${search}%,message.ilike.%${search}%`,
      );
    }

    if (startDate) {
      notificationsQuery = notificationsQuery.gte('created_at', startDate);
    }

    if (endDate) {
      notificationsQuery = notificationsQuery.lte('created_at', endDate);
    }

    const { data: notifications, count: notificationsCount } = await notificationsQuery;

    if (notifications) {
      notifications.forEach((notif) => {
        logs.push({
          id: notif.id,
          type: 'notification',
          event_type: notif.type,
          message: notif.title || notif.message,
          details: notif.message,
          user: notif.user,
          timestamp: notif.created_at,
          metadata: {
            is_read: notif.is_read,
          },
        });
      });
    }

    // 2. Logs de creación de grupos
    let groupsQuery = supabaseAdmin
      .from('groups')
      .select(
        `
        id,
        name,
        subject,
        created_at,
        creator_id,
        creator:creator_id (
          id,
          name,
          email
        )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(20);

    if (startDate) {
      groupsQuery = groupsQuery.gte('created_at', startDate);
    }

    if (endDate) {
      groupsQuery = groupsQuery.lte('created_at', endDate);
    }

    const { data: groups } = await groupsQuery;

    if (groups) {
      groups.forEach((group) => {
        if (!search || group.name.toLowerCase().includes(search.toLowerCase()) ||
          group.subject?.toLowerCase().includes(search.toLowerCase())) {
          logs.push({
            id: `group-${group.id}`,
            type: 'group_created',
            event_type: 'group_created',
            message: `Grupo "${group.name}" creado`,
            details: `Asignatura: ${group.subject || 'N/A'}`,
            user: group.creator,
            timestamp: group.created_at,
            metadata: {
              group_id: group.id,
              group_name: group.name,
            },
          });
        }
      });
    }

    // 3. Logs de sesiones completadas
    let sessionsQuery = supabaseAdmin
      .from('user_study_sessions')
      .select(
        `
        id,
        completed_at,
        duration_minutes,
        user_id,
        session_id,
        user:user_id (
          id,
          name,
          email
        ),
        session:session_id (
          id,
          title
        )
      `,
      )
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20);

    if (startDate) {
      sessionsQuery = sessionsQuery.gte('completed_at', startDate);
    }

    if (endDate) {
      sessionsQuery = sessionsQuery.lte('completed_at', endDate);
    }

    const { data: sessions } = await sessionsQuery;

    if (sessions) {
      sessions.forEach((session) => {
        logs.push({
          id: `session-${session.id}`,
          type: 'session_completed',
          event_type: 'session_completed',
          message: `Sesión completada: ${session.session?.title || 'Sin título'}`,
          details: `Duración: ${session.duration_minutes || 0} minutos`,
          user: session.user,
          timestamp: session.completed_at,
          metadata: {
            session_id: session.session_id,
            duration: session.duration_minutes,
          },
        });
      });
    }

    // Ordenar todos los logs por timestamp y aplicar límite
    const sortedLogs = logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, sanitizedLimit);

    // Filtrar por tipo si se especifica
    const filteredLogs = type
      ? sortedLogs.filter((log) => log.event_type === type)
      : sortedLogs;

    res.json({
      success: true,
      data: {
        logs: filteredLogs,
        total: notificationsCount || filteredLogs.length,
        pagination: {
          limit: sanitizedLimit,
          page: sanitizedPage,
          pages: Math.ceil((notificationsCount || filteredLogs.length) / sanitizedLimit),
        },
      },
    });
  }),
);

// GET /api/admin/logs/stats
router.get(
  '/logs/stats',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalNotifications,
      notificationsLast24h,
      notificationsLast7d,
      notificationsLast30d,
      groupsCreatedLast7d,
      sessionsCompletedLast7d,
    ] = await Promise.all([
      safeGetCount('notifications'),
      safeGetCount('notifications', (q) => q.gte('created_at', last24Hours.toISOString())),
      safeGetCount('notifications', (q) => q.gte('created_at', last7Days.toISOString())),
      safeGetCount('notifications', (q) => q.gte('created_at', last30Days.toISOString())),
      safeGetCount('groups', (q) => q.gte('created_at', last7Days.toISOString())),
      safeGetCount('user_study_sessions', (q) =>
        q.not('completed_at', 'is', null).gte('completed_at', last7Days.toISOString())
      ),
    ]);

    // Obtener tipos de eventos más comunes
    const { data: notificationTypes } = await supabaseAdmin
      .from('notifications')
      .select('type')
      .limit(1000);

    const typeCounts = {};
    notificationTypes?.forEach((notif) => {
      typeCounts[notif.type] = (typeCounts[notif.type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total: totalNotifications || 0,
        last24Hours: notificationsLast24h || 0,
        last7Days: notificationsLast7d || 0,
        last30Days: notificationsLast30d || 0,
        groupsCreatedLast7d: groupsCreatedLast7d || 0,
        sessionsCompletedLast7d: sessionsCompletedLast7d || 0,
        eventTypes: typeCounts,
      },
    });
  }),
);

module.exports = router;

