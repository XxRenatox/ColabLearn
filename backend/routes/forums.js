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

// @route   GET /api/forums
// @desc    Obtener foros disponibles
// @access  Private
router.get('/', [
  query('group_id').optional().isUUID().withMessage('ID de grupo inválido'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros inválidos', errors.array());
  }

  const { group_id, limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;

  const { data: userGroups, error: membershipError } = await supabaseAdmin
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (membershipError) {
    throw new AppError('Error verificando membresías: ' + membershipError.message, 500);
  }

  const memberGroupIds = (userGroups || []).map(member => member.group_id);

  let query = supabaseAdmin
    .from('forums')
    .select(`
      *,
      creator:creator_id (id, name, avatar),
      group:group_id (id, name, color)
    `)
    .eq('status', 'active')
    .order('last_activity', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filtrar por grupo si se especifica
  if (group_id) {
    query = query.eq('group_id', group_id);
  } else {
    const filters = [`is_public.eq.true`, `creator_id.eq.${userId}`];

    if (memberGroupIds.length > 0) {
      filters.push(`group_id.in.(${memberGroupIds.join(',')})`);
    }

    query = query.or(filters.join(','));
  }

  const { data: forums, error } = await query;

  if (error) {
    throw new AppError('Error obteniendo foros: ' + error.message, 500);
  }

  // Verificar permisos de acceso para cada foro
  const accessibleForums = [];
  for (const forum of forums || []) {
    if (forum.is_public || forum.creator_id === userId) {
      accessibleForums.push(forum);
    } else if (forum.group_id) {
      // Verificar si es miembro del grupo
      const { data: membership } = await supabaseAdmin
        .from('group_members')
        .select('status')
        .eq('group_id', forum.group_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (membership) {
        accessibleForums.push(forum);
      }
    }
  }

  res.json({
    success: true,
    data: {
      forums: accessibleForums,
      count: accessibleForums.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
  });
}));

// @route   GET /api/forums/:id
// @desc    Obtener detalles de un foro específico
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: forum, error } = await supabaseAdmin
    .from('forums')
    .select(`
      *,
      creator:creator_id (id, name, avatar, university, career),
      group:group_id (id, name, color, description)
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error || !forum) {
    throw createNotFoundError('Foro no encontrado');
  }

  // Verificar permisos de acceso
  if (!forum.is_public && forum.creator_id !== userId) {
    if (forum.group_id) {
      const { data: membership } = await supabaseAdmin
        .from('group_members')
        .select('status')
        .eq('group_id', forum.group_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!membership) {
        throw createForbiddenError('No tienes acceso a este foro');
      }
    } else {
      throw createForbiddenError('No tienes acceso a este foro');
    }
  }

  res.json({
    success: true,
    data: { forum }
  });
}));

// @route   POST /api/forums
// @desc    Crear un nuevo foro
// @access  Private
router.post('/', [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Título debe tener entre 3 y 200 caracteres'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Descripción muy larga'),
  body('group_id').optional().custom((value) => {
    // Permitir null, undefined, string vacío o UUID válido
    if (!value || value === '' || value === null) return true;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }).withMessage('ID de grupo inválido'),
  body('is_public').optional().isBoolean().withMessage('is_public debe ser booleano'),
  body('allow_replies').optional().isBoolean().withMessage('allow_replies debe ser booleano')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const { title, description, group_id, is_public = true, allow_replies = true } = req.body;
  const userId = req.user.id;

  // Normalizar group_id: convertir string vacío a null
  const normalizedGroupId = group_id && group_id.trim() !== '' ? group_id : null;

  // Verificar permisos solo si se asocia a un grupo
  if (normalizedGroupId) {
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('group_members')
      .select('role')
      .eq('group_id', normalizedGroupId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (memberError || !membership) {
      throw createForbiddenError('No eres miembro de este grupo');
    }
  }

  // Crear foro (usar supabaseAdmin para bypassear RLS)
  const { data: forum, error } = await supabaseAdmin
    .from('forums')
    .insert([{
      title,
      description,
      group_id: normalizedGroupId,
      creator_id: userId,
      is_public,
      allow_replies
    }])
    .select(`
      *,
      creator:creator_id (id, name, avatar),
      group:group_id (id, name, color)
    `)
    .single();

  if (error) {
    throw new AppError('Error creando foro: ' + error.message, 500);
  }

  res.status(201).json({
    success: true,
    message: 'Foro creado exitosamente',
    data: { forum }
  });
}));

// @route   PUT /api/forums/:id
// @desc    Actualizar un foro
// @access  Private (solo creador)
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Título inválido'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Descripción muy larga'),
  body('is_public').optional().isBoolean().withMessage('is_public debe ser booleano'),
  body('is_locked').optional().isBoolean().withMessage('is_locked debe ser booleano'),
  body('allow_replies').optional().isBoolean().withMessage('allow_replies debe ser booleano')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const { id } = req.params;
  const userId = req.user.id;
  const updateData = {};

  // Verificar que el foro existe y pertenece al usuario
  const { data: forum, error: forumError } = await supabaseAdmin
    .from('forums')
    .select('creator_id')
    .eq('id', id)
    .single();

  if (forumError || !forum) {
    throw createNotFoundError('Foro no encontrado');
  }

  if (forum.creator_id !== userId) {
    throw createForbiddenError('No tienes permisos para editar este foro');
  }

  // Construir objeto de actualización
  if (req.body.title) updateData.title = req.body.title;
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.is_public !== undefined) updateData.is_public = req.body.is_public;
  if (req.body.is_locked !== undefined) updateData.is_locked = req.body.is_locked;
  if (req.body.allow_replies !== undefined) updateData.allow_replies = req.body.allow_replies;

  const { data: updatedForum, error: updateError } = await supabaseAdmin
    .from('forums')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      creator:creator_id (id, name, avatar),
      group:group_id (id, name, color)
    `)
    .single();

  if (updateError) {
    throw new AppError('Error actualizando foro: ' + updateError.message, 500);
  }

  res.json({
    success: true,
    message: 'Foro actualizado exitosamente',
    data: { forum: updatedForum }
  });
}));

// @route   DELETE /api/forums/:id
// @desc    Eliminar un foro (soft delete)
// @access  Private (solo creador)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Verificar que el foro existe y pertenece al usuario
  const { data: forum, error: forumError } = await supabaseAdmin
    .from('forums')
    .select('creator_id')
    .eq('id', id)
    .single();

  if (forumError || !forum) {
    throw createNotFoundError('Foro no encontrado');
  }

  if (forum.creator_id !== userId) {
    throw createForbiddenError('No tienes permisos para eliminar este foro');
  }

  // Soft delete (usar supabaseAdmin para bypassear RLS)
  const { error: deleteError } = await supabaseAdmin
    .from('forums')
    .update({ status: 'deleted' })
    .eq('id', id);

  if (deleteError) {
    throw new AppError('Error eliminando foro: ' + deleteError.message, 500);
  }

  res.json({
    success: true,
    message: 'Foro eliminado exitosamente'
  });
}));

// @route   GET /api/forums/:id/posts
// @desc    Obtener posts de un foro
// @access  Private
router.get('/:id/posts', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset inválido'),
  query('sort').optional().isIn(['newest', 'oldest', 'popular']).withMessage('Orden inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros inválidos', errors.array());
  }

  const { id } = req.params;
  const { limit = 20, offset = 0, sort = 'newest' } = req.query;
  const userId = req.user.id;

  // Verificar acceso al foro
  const { data: forum, error: forumError } = await supabaseAdmin
    .from('forums')
    .select('id, is_public, creator_id, group_id, is_locked')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (forumError || !forum) {
    throw createNotFoundError('Foro no encontrado');
  }

  // Verificar permisos
  if (!forum.is_public && forum.creator_id !== userId) {
    if (forum.group_id) {
      const { data: membership } = await supabaseAdmin
        .from('group_members')
        .select('status')
        .eq('group_id', forum.group_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!membership) {
        throw createForbiddenError('No tienes acceso a este foro');
      }
    } else {
      throw createForbiddenError('No tienes acceso a este foro');
    }
  }

  // Determinar orden
  let orderBy = 'created_at';
  let ascending = false;
  if (sort === 'oldest') {
    ascending = true;
  } else if (sort === 'popular') {
    orderBy = 'likes';
    ascending = false;
  }

  // Obtener posts
  let postsQuery = supabaseAdmin
    .from('forum_posts')
    .select(`
      *,
      author:author_id (id, name, avatar, university, career),
      forum:forum_id (id, title)
    `)
    .eq('forum_id', id)
    .eq('is_deleted', false)
    .order('is_pinned', { ascending: false })
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);

  const { data: posts, error: postsError } = await postsQuery;

  if (postsError) {
    throw new AppError('Error obteniendo posts: ' + postsError.message, 500);
  }

  res.json({
    success: true,
    data: {
      posts: posts || [],
      count: posts?.length || 0,
      forum_locked: forum.is_locked,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
  });
}));

// @route   POST /api/forums/:id/posts
// @desc    Crear un nuevo post en un foro
// @access  Private
router.post('/:id/posts', [
  body('title').trim().isLength({ min: 3, max: 300 }).withMessage('Título inválido'),
  body('content').trim().isLength({ min: 10 }).withMessage('Contenido debe tener al menos 10 caracteres')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;

  // Verificar acceso y estado del foro
  const { data: forum, error: forumError } = await supabaseAdmin
    .from('forums')
    .select('id, is_public, creator_id, group_id, is_locked, allow_replies')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (forumError || !forum) {
    throw createNotFoundError('Foro no encontrado');
  }

  if (forum.is_locked) {
    throw createForbiddenError('Este foro está bloqueado');
  }

  if (!forum.allow_replies) {
    throw createForbiddenError('No se permiten nuevos posts en este foro');
  }

  // Verificar permisos
  if (!forum.is_public && forum.creator_id !== userId) {
    if (forum.group_id) {
      const { data: membership } = await supabaseAdmin
        .from('group_members')
        .select('status')
        .eq('group_id', forum.group_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!membership) {
        throw createForbiddenError('No eres miembro de este grupo');
      }
    } else {
      throw createForbiddenError('No tienes acceso a este foro');
    }
  }

  // Crear post (usar supabaseAdmin para bypassear RLS)
  const { data: post, error: postError } = await supabaseAdmin
    .from('forum_posts')
    .insert([{
      forum_id: id,
      author_id: userId,
      title,
      content
    }])
    .select(`
      *,
      author:author_id (id, name, avatar, university, career)
    `)
    .single();

  if (postError) {
    throw new AppError('Error creando post: ' + postError.message, 500);
  }

  res.status(201).json({
    success: true,
    message: 'Post creado exitosamente',
    data: { post }
  });
}));

// @route   GET /api/forums/posts/:postId
// @desc    Obtener detalles de un post específico
// @access  Private
router.get('/posts/:postId', asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const { data: post, error } = await supabaseAdmin
    .from('forum_posts')
    .select(`
      *,
      author:author_id (id, name, avatar, university, career),
      forum:forum_id (
        id,
        title,
        is_public,
        is_locked,
        group_id
      )
    `)
    .eq('id', postId)
    .eq('is_deleted', false)
    .single();

  if (error || !post) {
    throw createNotFoundError('Post no encontrado');
  }

  // Verificar acceso al foro
  const forum = post.forum;
  if (!forum.is_public && forum.creator_id !== userId) {
    if (forum.group_id) {
      const { data: membership } = await supabaseAdmin
        .from('group_members')
        .select('status')
        .eq('group_id', forum.group_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!membership) {
        throw createForbiddenError('No tienes acceso a este post');
      }
    } else {
      throw createForbiddenError('No tienes acceso a este post');
    }
  }

  // Incrementar vistas (usar supabaseAdmin para bypassear RLS)
  await supabaseAdmin
    .from('forum_posts')
    .update({ views: (post.views || 0) + 1 })
    .eq('id', postId);

  // Obtener respuestas
  const { data: replies, error: repliesError } = await supabaseAdmin
    .from('forum_replies')
    .select(`
      *,
      author:author_id (id, name, avatar, university, career)
    `)
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (repliesError) {
    // Error obteniendo respuestas
  }

  res.json({
    success: true,
    data: {
      post: {
        ...post,
        views: (post.views || 0) + 1
      },
      replies: replies || []
    }
  });
}));

// @route   POST /api/forums/posts/:postId/replies
// @desc    Crear una respuesta a un post
// @access  Private
router.post('/posts/:postId/replies', [
  body('content').trim().isLength({ min: 5 }).withMessage('Contenido debe tener al menos 5 caracteres'),
  body('parent_reply_id').optional().isUUID().withMessage('ID de respuesta padre inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const { postId } = req.params;
  const { content, parent_reply_id } = req.body;
  const userId = req.user.id;

  // Verificar que el post existe y obtener información del foro
  const { data: post, error: postError } = await supabaseAdmin
    .from('forum_posts')
    .select(`
      id,
      forum_id,
      is_locked,
      forum:forum_id (
        id,
        is_public,
        creator_id,
        group_id,
        is_locked,
        allow_replies
      )
    `)
    .eq('id', postId)
    .eq('is_deleted', false)
    .single();

  if (postError || !post) {
    throw createNotFoundError('Post no encontrado');
  }

  const forum = post.forum;

  if (forum.is_locked || post.is_locked) {
    throw createForbiddenError('Este post está bloqueado');
  }

  if (!forum.allow_replies) {
    throw createForbiddenError('No se permiten respuestas en este foro');
  }

  // Verificar permisos
  if (!forum.is_public && forum.creator_id !== userId) {
    if (forum.group_id) {
      const { data: membership } = await supabaseAdmin
        .from('group_members')
        .select('status')
        .eq('group_id', forum.group_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!membership) {
        throw createForbiddenError('No eres miembro de este grupo');
      }
    } else {
      throw createForbiddenError('No tienes acceso a este foro');
    }
  }

  // Crear respuesta (usar supabaseAdmin para bypassear RLS)
  const { data: reply, error: replyError } = await supabaseAdmin
    .from('forum_replies')
    .insert([{
      post_id: postId,
      author_id: userId,
      content,
      parent_reply_id: parent_reply_id || null
    }])
    .select(`
      *,
      author:author_id (id, name, avatar, university, career)
    `)
    .single();

  if (replyError) {
    throw new AppError('Error creando respuesta: ' + replyError.message, 500);
  }

  res.status(201).json({
    success: true,
    message: 'Respuesta creada exitosamente',
    data: { reply }
  });
}));

// @route   POST /api/forums/posts/:postId/like
// @desc    Dar like a un post
// @access  Private
router.post('/posts/:postId/like', asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  // Verificar que el post existe
  const { data: post, error: postError } = await supabaseAdmin
    .from('forum_posts')
    .select('id')
    .eq('id', postId)
    .eq('is_deleted', false)
    .single();

  if (postError || !post) {
    throw createNotFoundError('Post no encontrado');
  }

  // Verificar si ya dio like
  const { data: existingLike, error: likeError } = await supabaseAdmin
    .from('forum_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  // Obtener likes actuales del post
  const { data: currentPost, error: postDataError } = await supabaseAdmin
    .from('forum_posts')
    .select('likes')
    .eq('id', postId)
    .single();

  const currentLikes = currentPost?.likes || 0;

  if (existingLike) {
    // Quitar like (usar supabaseAdmin para bypassear RLS)
    await supabaseAdmin
      .from('forum_likes')
      .delete()
      .eq('id', existingLike.id);

    const newLikes = Math.max(0, currentLikes - 1);
    await supabaseAdmin
      .from('forum_posts')
      .update({ likes: newLikes })
      .eq('id', postId);

    res.json({
      success: true,
      message: 'Like removido',
      data: { 
        liked: false,
        likes: newLikes
      }
    });
  } else {
    // Agregar like (usar supabaseAdmin para bypassear RLS)
    const { error: insertError } = await supabaseAdmin
      .from('forum_likes')
      .insert([{
        post_id: postId,
        user_id: userId
      }]);

    if (insertError) {
      throw new AppError('Error dando like: ' + insertError.message, 500);
    }

    const newLikes = currentLikes + 1;
    await supabaseAdmin
      .from('forum_posts')
      .update({ likes: newLikes })
      .eq('id', postId);

    res.json({
      success: true,
      message: 'Like agregado',
      data: { 
        liked: true,
        likes: newLikes
      }
    });
  }
}));

module.exports = router;

