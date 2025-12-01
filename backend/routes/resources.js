const express = require('express');
const { query, validationResult } = require('express-validator');
const { supabaseAdmin: supabase } = require('../config/database');
const {
  asyncHandler,
  AppError,
  createValidationError,
  createNotFoundError,
  createForbiddenError
} = require('../middleware/errorHandler');
const { 
  fileValidators, 
  resourceValidators, 
  validate 
} = require('../validators');

const router = express.Router();

/**
 * Tipos de archivos permitidos con validación estricta
 */
const ALLOWED_FILE_TYPES = [
  // Documentos seguros
  'application/pdf',
  'text/plain',
  'application/rtf',
  // Hojas de cálculo (solo formatos seguros)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  // Imágenes seguras y pequeñas
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Archivos comprimidos (con límites estrictos)
  'application/zip'
];

/**
 * Extensiones peligrosas bloqueadas
 */
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar',
  '.php', '.asp', '.jsp', '.cgi', '.pl', '.py', '.sh', '.dll', '.so',
  '.dmg', '.pkg', '.deb', '.rpm', '.msi', '.app', '.apk'
];

/**
 * Tipos MIME peligrosos
 */
const DANGEROUS_MIME_TYPES = [
  'application/x-executable',
  'application/x-msdownload',
  'application/octet-stream',
  'text/javascript',
  'application/javascript',
  'text/x-python',
  'application/x-python-code'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // Reducido a 5MB
const MAX_FILES_PER_USER_PER_HOUR = 10; // Límite de archivos por hora
const MAX_FILES_PER_USER_PER_DAY = 50; // Límite de archivos por día

/**
 * Función para validar contenido de archivo
 */
function validateFileContent(buffer, mimeType) {
  // Verificar que el archivo no contenga código ejecutable
  if (mimeType === 'text/plain' || mimeType === 'application/rtf') {
    const content = buffer.toString('utf8', 0, 1000); // Leer primeros 1000 caracteres
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /<?php/i,
      /<%/i,
      /#!/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        throw new Error('Archivo contiene contenido potencialmente peligroso');
      }
    }
  }

  // Verificar archivos PDF (firmas PDF válidas)
  if (mimeType === 'application/pdf') {
    if (!buffer.slice(0, 4).equals(Buffer.from('%PDF'))) {
      throw new Error('Archivo PDF inválido');
    }
  }

  // Verificar imágenes (firmas de archivo válidas)
  if (mimeType.startsWith('image/')) {
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46]
    };

    const signature = signatures[mimeType];
    if (signature) {
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
          throw new Error('Archivo de imagen inválido o corrupto');
        }
      }
    }
  }

  return true;
}

/**
 * Función para verificar límites de subida
 */
async function checkUploadLimits(userId) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Verificar archivos subidos en la última hora
  const { data: recentUploads, error: hourError } = await supabase
    .from('files')
    .select('id')
    .eq('uploaded_by', userId)
    .gte('created_at', oneHourAgo.toISOString());

  if (hourError) {
    throw new Error('Error verificando límites de subida');
  }

  if (recentUploads && recentUploads.length >= MAX_FILES_PER_USER_PER_HOUR) {
    throw new Error(`Has alcanzado el límite de ${MAX_FILES_PER_USER_PER_HOUR} archivos por hora`);
  }

  // Verificar archivos subidos en las últimas 24 horas
  const { data: dailyUploads, error: dayError } = await supabase
    .from('files')
    .select('id')
    .eq('uploaded_by', userId)
    .gte('created_at', oneDayAgo.toISOString());

  if (dayError) {
    throw new Error('Error verificando límites de subida');
  }

  if (dailyUploads && dailyUploads.length >= MAX_FILES_PER_USER_PER_DAY) {
    throw new Error(`Has alcanzado el límite de ${MAX_FILES_PER_USER_PER_DAY} archivos por día`);
  }
}

/**
 * Función para sanitizar nombre de archivo
 */
function sanitizeFileName(filename) {
  // Remover caracteres peligrosos y espacios
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Caracteres peligrosos
    .replace(/\s+/g, '_') // Espacios a guiones bajos
    .substring(0, 100); // Limitar longitud
}

// @route   GET /api/resources
// @desc    Obtener lista de recursos disponibles
// @access  Private
router.get('/', [
  query('group_id').optional().isUUID().withMessage('ID de grupo inválido'),
  query('resource_type').optional().isIn(['guide', 'document', 'link', 'exercise', 'material_theory', 'video', 'tool', 'other']).withMessage('Tipo de recurso inválido'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe ser entre 1 y 50'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Parámetros inválidos', errors.array());
  }

  const { group_id, resource_type, limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;

  let allResources = [];
  const resourceIds = new Set();

  // 1. Obtener recursos públicos
  const publicQuery = supabase
    .from('files')
    .select(`
      *,
      uploader:uploaded_by (
        id, name, avatar, university, career
      ),
      group:group_id (
        id, name, color
      )
    `)
    .eq('is_public', true);

  // Aplicar filtros a recursos públicos
  if (group_id) publicQuery.eq('group_id', group_id);
  if (resource_type) publicQuery.eq('resource_type', resource_type);

  const { data: publicResources } = await publicQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (publicResources) {
    publicResources.forEach(r => {
      allResources.push(r);
      resourceIds.add(r.id);
    });
  }

  // 2. Si necesitamos más recursos, obtener recursos propios del usuario
  if (allResources.length < limit && offset < allResources.length + limit) {
    const userQuery = supabase
      .from('files')
      .select(`
        *,
        uploader:uploaded_by (
          id, name, avatar, university, career
        ),
        group:group_id (
          id, name, color
        )
      `)
      .eq('uploaded_by', userId)
      .eq('is_public', false);

    // Aplicar filtros
    if (group_id) userQuery.eq('group_id', group_id);
    if (resource_type) userQuery.eq('resource_type', resource_type);

    const userOffset = Math.max(0, offset - (publicResources?.length || 0));
    const userLimit = limit - allResources.length;

    const { data: userResources } = await userQuery
      .order('created_at', { ascending: false })
      .range(userOffset, userOffset + userLimit - 1);

    if (userResources) {
      userResources.forEach(r => {
        if (!resourceIds.has(r.id)) {
          allResources.push(r);
          resourceIds.add(r.id);
        }
      });
    }
  }

  // 3. Si aún necesitamos más recursos, obtener recursos de grupos
  if (allResources.length < limit) {
    const { data: userGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (userGroups && userGroups.length > 0) {
      const groupIds = userGroups.map(g => g.group_id);

      const groupQuery = supabase
        .from('files')
        .select(`
          *,
          uploader:uploaded_by (
            id, name, avatar, university, career
          ),
          group:group_id (
            id, name, color
          )
        `)
        .in('group_id', groupIds);

      // Aplicar filtros
      if (group_id) groupQuery.eq('group_id', group_id);
      if (resource_type) groupQuery.eq('resource_type', resource_type);

      const groupOffset = Math.max(0, offset - allResources.length);
      const groupLimit = limit - allResources.length;

      const { data: groupResources } = await groupQuery
        .order('created_at', { ascending: false })
        .range(groupOffset, groupOffset + groupLimit - 1);

      if (groupResources) {
        groupResources.forEach(r => {
          if (!resourceIds.has(r.id)) {
            allResources.push(r);
            resourceIds.add(r.id);
          }
        });
      }
    }
  }

  // Aplicar límite final
  const resources = allResources.slice(0, limit);

  // Obtener estadísticas de descarga para cada recurso
  const finalResourceIds = resources?.map(r => r.id) || [];
  let downloadStats = {};

  if (finalResourceIds.length > 0) {
    const { data: stats } = await supabase
      .from('file_downloads')
      .select('file_id, user_id')
      .in('file_id', finalResourceIds);

    stats?.forEach(stat => {
      if (!downloadStats[stat.file_id]) {
        downloadStats[stat.file_id] = { total: 0, downloaded_by_user: false };
      }
      downloadStats[stat.file_id].total++;
      if (stat.user_id === userId) {
        downloadStats[stat.file_id].downloaded_by_user = true;
      }
    });
  }

  // Agregar estadísticas a cada recurso
  const resourcesWithStats = resources?.map(resource => ({
    ...resource,
    download_stats: downloadStats[resource.id] || { total: 0, downloaded_by_user: false }
  })) || [];

  res.json({
    success: true,
    data: {
      resources: resourcesWithStats,
      count: resourcesWithStats.length,
      filters: {
        group_id,
        limit,
        offset
      }
    }
  });
}));

// @route   POST /api/resources
// @desc    Subir un nuevo recurso
// @access  Private
router.post('/', 
  validate(resourceValidators.createResource),
  fileValidators.fileType('file', [
    'application/pdf',
    'text/plain',
    'application/rtf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip'
  ]),
  fileValidators.fileSize('file', 10), // 10MB max
  asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, is_public = true, group_id, resource_type = 'document' } = req.body;

  // Convertir tipos de datos
  const isPublic = is_public === 'true';
  const groupId = group_id && group_id !== '' ? group_id : null;
  
  // Validar resource_type
  const validResourceTypes = ['guide', 'document', 'link', 'exercise', 'material_theory', 'video', 'tool', 'other'];
  const resourceType = validResourceTypes.includes(resource_type) ? resource_type : 'document';

  // Verificar límites de subida antes de procesar
  await checkUploadLimits(userId);

  // Verificar permisos si se sube a un grupo
  if (groupId) {
    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (memberError || !membership) {
      throw createForbiddenError('No eres miembro de este grupo');
    }
  }

  // Verificar que hay un archivo en la request
  if (!req.files || !req.files.file) {
    throw createValidationError('No se encontró archivo en la solicitud');
  }

  const file = req.files.file;

  // Validaciones de seguridad del archivo
  if (file.size > MAX_FILE_SIZE) {
    throw createValidationError(`Archivo demasiado grande. Máximo permitido: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    throw createValidationError(`Tipo de archivo no permitido. Tipos permitidos: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }

  if (DANGEROUS_MIME_TYPES.includes(file.mimetype)) {
    throw createValidationError('Tipo de archivo potencialmente peligroso');
  }

  // Verificar extensión del archivo
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
    throw createValidationError('Extensión de archivo no permitida');
  }

  // Validar contenido del archivo
  try {
    validateFileContent(file.data, file.mimetype);
  } catch (validationError) {
    throw createValidationError(`Archivo inválido: ${validationError.message}`);
  }

  // Sanitizar nombre de archivo
  const sanitizedFileName = sanitizeFileName(file.name);

  // Generar ID único y path de almacenamiento seguro
  const fileId = crypto.randomUUID();
  const storagePath = `resources/${userId}/${fileId}/${sanitizedFileName}`;

  // Subir archivo a Supabase Storage
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resources')
      .upload(storagePath, file.data, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      throw new Error('Error subiendo archivo: ' + uploadError.message);
    }

    // Insertar registro en la base de datos
    const { data: resource, error } = await supabase
      .from('files')
      .insert({
        id: fileId,
        name: sanitizedFileName,
        original_name: file.name,
        mime_type: file.mimetype,
        size: file.size,
        storage_path: storagePath,
        uploaded_by: userId,
        group_id: groupId,
        is_public: isPublic,
        resource_type: resourceType
      })
      .select(`
        *,
        uploader:uploaded_by (id, name, avatar),
        group:group_id (id, name, color)
      `)
      .single();

    if (error) {
      // Si falla el insert, borrar el archivo subido
      await supabase.storage.from('resources').remove([storagePath]);
      throw new AppError('Error creando recurso: ' + error.message, 500);
    }

    res.status(201).json({
      success: true,
      message: 'Recurso subido exitosamente',
      data: {
        resource
      }
    });

  } catch (uploadError) {
    throw new AppError('Error procesando archivo: ' + uploadError.message, 500);
  }
}));

// @route   GET /api/resources/:id
// @desc    Obtener detalles de un recurso específico
// @access  Private
router.get('/:id', 
  validate(resourceValidators.getResource),
  asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: resource, error } = await supabase
    .from('files')
    .select(`
      *,
      uploader:uploaded_by (
        id, name, avatar, university, career
      ),
      group:group_id (
        id, name, color, description
      )
    `)
    .eq('id', id)
    .single();

  if (error || !resource) {
    throw createNotFoundError('Recurso no encontrado');
  }

  // Verificar permisos de acceso
  if (!resource.is_public) {
    // Si no es público, verificar si el usuario puede acceder
    if (resource.uploaded_by !== userId) {
      if (resource.group_id) {
        // Verificar si es miembro del grupo
        const { data: membership } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', resource.group_id)
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (!membership) {
          throw createForbiddenError('No tienes acceso a este recurso');
        }
      } else {
        throw createForbiddenError('No tienes acceso a este recurso');
      }
    }
  }

  // Obtener estadísticas de descarga
  const { data: downloads } = await supabase
    .from('file_downloads')
    .select('*')
    .eq('file_id', id);

  const downloadStats = {
    total: downloads?.length || 0,
    downloaded_by_user: downloads?.some(d => d.user_id === userId) || false
  };

  res.json({
    success: true,
    data: {
      resource,
      download_stats: downloadStats
    }
  });
}));

// @route   GET /api/resources/:id/download
// @desc    Descargar un recurso
// @access  Private
router.get('/:id/download', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: resource, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !resource) {
    throw createNotFoundError('Recurso no encontrado');
  }

  // Verificar permisos de acceso
  if (!resource.is_public) {
    if (resource.uploaded_by !== userId) {
      if (resource.group_id) {
        const { data: membership } = await supabase
          .from('group_members')
          .select('role')
          .eq('group_id', resource.group_id)
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (!membership) {
          throw createForbiddenError('No tienes acceso a este recurso');
        }
      } else {
        throw createForbiddenError('No tienes acceso a este recurso');
      }
    }
  }

  // Registrar descarga
  await supabase
    .from('file_downloads')
    .insert({
      file_id: id,
      user_id: userId,
      downloaded_at: new Date().toISOString()
    });

  // Incrementar contador de descargas
  await supabase
    .from('files')
    .update({ download_count: (resource.download_count || 0) + 1 })
    .eq('id', id);

  // Generar URL firmada para descarga
  const { data: downloadUrl, error: urlError } = await supabase.storage
    .from('resources')
    .createSignedUrl(resource.storage_path, 3600); // 1 hora

  if (urlError) {
    throw new AppError('Error generando URL de descarga: ' + urlError.message, 500);
  }

  res.json({
    success: true,
    message: 'Descarga registrada',
    data: {
      download_url: downloadUrl.signedUrl,
      resource: {
        id: resource.id,
        name: resource.name,
        original_name: resource.original_name || resource.name,
        mime_type: resource.mime_type,
        size: resource.size
      }
    }
  });
}));

// @route   DELETE /api/resources/:id
// @desc    Eliminar un recurso
// @access  Private
router.delete('/:id', 
  validate(resourceValidators.deleteResource),
  asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: resource, error: findError } = await supabase
    .from('files')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !resource) {
    throw createNotFoundError('Recurso no encontrado');
  }

  // Verificar permisos (solo el uploader o admin del grupo puede eliminar)
  let canDelete = resource.uploaded_by === userId;

  if (!canDelete && resource.group_id) {
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', resource.group_id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    canDelete = membership && membership.role === 'admin';
  }

  if (!canDelete) {
    throw createForbiddenError('No tienes permisos para eliminar este recurso');
  }

  // Eliminar permanentemente
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('Error eliminando recurso: ' + error.message, 500);
  }

  // Borrar archivo de storage
  await supabase.storage.from('resources').remove([resource.storage_path]);

  res.json({
    success: true,
    message: 'Recurso eliminado exitosamente'
  });
}));

module.exports = router;
