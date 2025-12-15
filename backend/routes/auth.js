const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/database');
const {
  asyncHandler,
  AppError,
  createValidationError,
  createNotFoundError,
  createAuthError
} = require('../middleware/errorHandler');
const RefreshTokenService = require('../services/refreshTokenService');
const TokenBlacklistService = require('../services/tokenBlacklistService');

const router = express.Router();

// Validaciones
const strongPassword = (value) => {
  const lengthOk = typeof value === 'string' && value.length >= 8 && value.length <= 128;
  const lowerOk = /[a-z]/.test(value);
  const upperOk = /[A-Z]/.test(value);
  const digitOk = /\d/.test(value);
  const specialOk = /[^A-Za-z0-9]/.test(value);
  const noSpaces = !/\s/.test(value);
  if (!(lengthOk && lowerOk && upperOk && digitOk && specialOk && noSpaces)) {
    throw new Error('La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo, sin espacios');
  }
  return true;
};

const registerValidation = [
  body('email')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .custom(strongPassword),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1'`\-\s]+$/).withMessage('Nombre contiene caracteres no permitidos'),
  body('avatar')
    .optional()
    .isString().isLength({ max: 10 }).withMessage('Avatar inválido')
];

const loginValidation = [
  body('email')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Contraseña es requerida')
];

// @route   POST /api/auth/register
// @desc    Registrar nuevo usuario
// @access  Public
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createValidationError('Datos de registro inválidos', errors.array());
    }

    const { email, password, name, avatar } = req.body;

    // Normalizar email antes de verificar
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si el usuario ya existe en nuestra tabla users
    const { data: existingUser, error: fetchUserError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (fetchUserError) {
      throw new AppError('Error verificando usuarios existentes: ' + fetchUserError.message, 500);
    }

    if (existingUser) {
      throw new AppError('El usuario ya existe con este email', 409);
    }

    // Crear usuario en Supabase Auth con email normalizado
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: process.env.NODE_ENV === 'development', // Auto-confirmar en desarrollo
      user_metadata: {
        name: name.trim(),
        avatar: avatar || null
      }
    });

    if (authError || !authData?.user) {
      throw new AppError('Error creando usuario: ' + (authError?.message || 'Sin detalles'), 400);
    }

    const userId = authData.user.id;

    // Asegurar que los metadatos se sincronicen en Supabase Auth
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          name: name.trim(),
          avatar: avatar || null
        }
      });
    } catch (metadataError) {
      // No interrumpir el flujo si la sincronización de metadatos falla
    }

    // Hash de la contraseña para almacenar en nuestra tabla
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear perfil de usuario en nuestra tabla
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: userId,
        email: normalizedEmail,
        password_hash: hashedPassword,
        name: name.trim(),
        university: "",
        career: "",
        semester: "",
        avatar: avatar || null,
        role: 'student', // Asegurar que el rol esté definido
        email_verified: process.env.NODE_ENV === 'development'
      }])
      .select(`
        id, email, name, avatar, university, career, semester,
        level, xp, streak, study_hours, role, is_active,
        preferences, total_sessions, total_groups,
        password_hash, email_verified
      `)
      .single();

    if (userError) {
      // Si falla la creación del perfil, eliminar usuario de Auth
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (deleteError) {
      }
      throw new AppError('Error creando perfil de usuario: ' + userError.message + (userError.details ? ' - ' + userError.details : ''), 500);
    }

    if (!userData) {
      // Si no se retornó el usuario, intentar eliminarlo de Auth
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (deleteError) {
      }
      throw new AppError('Error: no se pudo crear el perfil de usuario', 500);
    }


    // Obtener sesión de Supabase para devolverla al frontend
    let supabaseSession = null;
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (!sessionError && sessionData?.session) {
        supabaseSession = sessionData.session;
      } else if (sessionError) {
      }
    } catch (sessionException) {
      // No interrumpir el flujo si no se puede obtener la sesión de Supabase
    }

    // Desbloquear logro de bienvenida (si existe)
    try {
      // Intentar encontrar un logro de bienvenida o primer paso
      const { data: welcomeAchievement } = await supabaseAdmin
        .from('achievements')
        .select('id, xp_reward')
        .or('name.ilike.%bienvenida%,name.ilike.%primer paso%')
        .limit(1)
        .maybeSingle();

      if (welcomeAchievement) {
        await supabaseAdmin
          .from('user_achievements')
          .insert([{
            user_id: userId,
            achievement_id: welcomeAchievement.id,
            unlocked_at: new Date().toISOString(),
            progress: { completed: true }
          }]);

        // Sumar los puntos de experiencia del logro (si existe la función RPC)
        if (welcomeAchievement.xp_reward) {
          try {
            await supabaseAdmin.rpc('increment_user_xp', {
              user_id: userId,
              xp_amount: welcomeAchievement.xp_reward || 10
            });
          } catch (rpcError) {
            // RPC increment_user_xp no disponible, actualizar manualmente
            try {
              // Obtener XP actual
              const { data: currentUser } = await supabaseAdmin
                .from('users')
                .select('xp')
                .eq('id', userId)
                .single();

              if (currentUser) {
                const newXp = (currentUser.xp || 0) + (welcomeAchievement.xp_reward || 10);
                await supabaseAdmin
                  .from('users')
                  .update({ xp: newXp })
                  .eq('id', userId);
              }
            } catch (updateError) {
              // Ignorar si falla la actualización manual
            }
          }
        }
      }
    } catch (error) {
      // No lanzamos error para no interrumpir el flujo de registro
    }

    // Verificar que JWT_SECRET esté definido
    if (!process.env.JWT_SECRET) {
      // Si falla, intentar eliminar el usuario creado
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        await supabaseAdmin.from('users').delete().eq('id', userId);
      } catch (cleanupError) {
      }
      throw new AppError('JWT_SECRET no está configurado en las variables de entorno', 500);
    }

    // Generar access token JWT (corta duración: 1 hora)
    let accessToken;
    try {
      accessToken = jwt.sign(
        {
          userId: userData.id,
          email: userData.email,
          role: userData.role || 'student' // Usar 'student' como fallback si role es undefined
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );
    } catch (jwtError) {
      // Si falla, intentar eliminar el usuario creado
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        await supabaseAdmin.from('users').delete().eq('id', userId);
      } catch (cleanupError) {
      }
      throw new AppError(`Error generando access token: ${jwtError.message}`, 500);
    }

    // Generar refresh token
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      platform: req.headers['sec-ch-ua-platform'] || 'unknown'
    };

    let refreshTokenData;
    try {
      refreshTokenData = await RefreshTokenService.createRefreshToken(
        userData.id,
        deviceInfo,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent']
      );
    } catch (refreshTokenError) {
      // Si falla la creación del refresh token, continuar sin él
      // El usuario podrá usar solo el access token
      refreshTokenData = {
        token: null,
        refreshTokenId: null,
        expiresAt: null
      };
    }

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          university: userData.university,
          career: userData.career,
          semester: userData.semester,
          level: userData.level,
          xp: userData.xp,
          streak: userData.streak
        },
        token: accessToken,
        refreshToken: refreshTokenData.token,
        expiresAt: refreshTokenData.expiresAt,
        supabaseSession
      }
    });
  } catch (error) {
    throw error; // Re-lanzar para que asyncHandler lo maneje
  }
}));

// @route   POST /api/auth/login
// @desc    Iniciar sesión
// @access  Public
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos de login inválidos', errors.array());
  }

  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // Autenticar contra Supabase Auth (fuente de verdad para credenciales)
  let authData = null;
  let supabaseUser = null;
  let userData = null;

  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });
    if (authError || !data?.user) {
      throw authError || new Error('Auth error');
    }
    authData = data;
    supabaseUser = data.user;
  } catch (authError) {
    // Fallback usando hash local si Supabase Auth falla (sin revelar detalles)
    const { data: fallbackProfile, error: fallbackError } = await supabaseAdmin
      .from('users')
      .select(`
        id, email, name, avatar, university, career, semester,
        level, xp, streak, study_hours, role, is_active,
        preferences, total_sessions, total_groups,
        password_hash, email_verified
      `)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (fallbackError || !fallbackProfile) {
      // Usuario no existe en la base de datos
      throw createAuthError('No existe una cuenta con este correo electrónico. Por favor, verifica el correo o regístrate.');
    }

    if (!fallbackProfile.password_hash) {
      // Usuario existe pero no tiene contraseña (caso raro)
      throw createAuthError('Error en la configuración de tu cuenta. Por favor, contacta al soporte.');
    }

    const matches = await bcrypt.compare(password, fallbackProfile.password_hash);
    if (!matches) {
      // Contraseña incorrecta
      throw createAuthError('La contraseña es incorrecta. Por favor, verifica tu contraseña e intenta nuevamente.');
    }

    // Intentar sincronizar con Supabase Auth (actualizar contraseña para usuario existente)
    // Como ya tenemos el userId del perfil, podemos intentar actualizar directamente
    try {
      if (fallbackProfile?.id) {
        // Intentar actualizar la contraseña en Supabase Auth usando el ID del usuario
        // Si la actualización funciona, significa que el usuario existe en Auth
        // Si falla, el usuario puede no existir en Auth todavía, lo cual está bien
        try {
          await supabaseAdmin.auth.admin.updateUserById(fallbackProfile.id, { password });
          // Si llegamos aquí, el usuario existe en Auth. Usamos el ID del perfil como userId
          supabaseUser = {
            id: fallbackProfile.id,
            email: fallbackProfile.email,
            user_metadata: {}
          };
        } catch (updateError) {
          // Si falla la actualización, el usuario puede no existir en Auth todavía
          // Crear un objeto supabaseUser básico con los datos del perfil
          supabaseUser = {
            id: fallbackProfile.id,
            email: fallbackProfile.email,
            user_metadata: {}
          };
        }
      }
    } catch (adminError) {
      // No exponer detalles específicos, pero asegurar que tengamos un supabaseUser
      if (!supabaseUser && fallbackProfile?.id) {
        supabaseUser = {
          id: fallbackProfile.id,
          email: fallbackProfile.email,
          user_metadata: {}
        };
      }
    }

    userData = fallbackProfile;
  }

  if (!supabaseUser) {
    throw createAuthError('Credenciales inválidas');
  }

  const userId = supabaseUser.id;

  if (!userData) {
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select(`
      id, email, name, avatar, university, career, semester,
      level, xp, streak, study_hours, role, is_active,
      preferences, total_sessions, total_groups,
      password_hash, email_verified
    `)
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      throw new AppError('Error obteniendo perfil de usuario', 500);
    }

    userData = existingProfile;
  }

  // Si el perfil no existe, crearlo automáticamente con valores por defecto
  if (!userData) {
    const defaultName =
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split('@')[0] ||
      'Usuario';
    const defaultAvatar = supabaseUser.user_metadata?.avatar || '👤';

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: createdProfile, error: createProfileError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: userId,
        email: normalizedEmail,
        password_hash: hashedPassword,
        name: defaultName,
        avatar: defaultAvatar,
        university: '',
        career: '',
        semester: '',
        email_verified: !!supabaseUser.email_confirmed_at
      }])
      .select(`
        id, email, name, avatar, university, career, semester,
        level, xp, streak, study_hours, role, is_active,
        preferences, total_sessions, total_groups,
        password_hash, email_verified
      `)
      .single();

    if (createProfileError || !createdProfile) {
      throw new AppError('Error creando perfil del usuario', 500);
    }

    userData = createdProfile;
  }

  if (!userData || !userData.id) {
    throw createAuthError('Credenciales inválidas');
  }

  if (!userData.is_active) {
    throw new AppError('Tu cuenta ha sido desactivada por un administrador. Por favor, contacta al soporte si crees que esto es un error.', 403);
  }

  // Sincronizar hash de contraseña local si es diferente (opcional pero recomendado)
  if (userData.password_hash) {
    const passwordMatches = await bcrypt.compare(password, userData.password_hash);
    if (!passwordMatches) {
      const salt = await bcrypt.genSalt(12);
      const updatedHash = await bcrypt.hash(password, salt);
      await supabaseAdmin
        .from('users')
        .update({ password_hash: updatedHash })
        .eq('id', userData.id);

      userData.password_hash = updatedHash;
    }
  } else {
    const salt = await bcrypt.genSalt(12);
    const updatedHash = await bcrypt.hash(password, salt);
    await supabaseAdmin
      .from('users')
      .update({ password_hash: updatedHash })
      .eq('id', userId);
    userData.password_hash = updatedHash;
  }

  // Actualizar metadatos básicos en Supabase Auth si falta información
  try {
    const metadataUpdate = {};
    if (!supabaseUser.user_metadata?.name && userData.name) {
      metadataUpdate.name = userData.name;
    }
    if (!supabaseUser.user_metadata?.avatar && userData.avatar) {
      metadataUpdate.avatar = userData.avatar;
    }
    if (Object.keys(metadataUpdate).length > 0) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...supabaseUser.user_metadata,
          ...metadataUpdate
        }
      });
    }
  } catch (metadataSyncError) {
    // No interrumpir el flujo si la sincronización de metadatos falla
  }

  // Actualizar última actividad
  await supabaseAdmin
    .from('users')
    .update({ last_active: new Date().toISOString() })
    .eq('id', userId);

  // Verificar que JWT_SECRET esté definido
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET no está configurado en las variables de entorno', 500);
  }

  // Generar access token JWT (corta duración: 1 hora)
  let accessToken;
  try {
    accessToken = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        role: userData.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
  } catch (jwtError) {
    throw new AppError(`Error generando access token: ${jwtError.message}`, 500);
  }

  // Generar refresh token
  const deviceInfo = {
    userAgent: req.headers['user-agent'] || '',
    platform: req.headers['sec-ch-ua-platform'] || 'unknown'
  };

  // Generar refresh token (funciona sin tablas usando JWT)
  let refreshTokenData;
  try {
    refreshTokenData = await RefreshTokenService.createRefreshToken(
      userData.id,
      deviceInfo,
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent']
    );
  } catch (refreshTokenError) {
    // Si falla la creación del refresh token, continuar sin él
    // El usuario podrá usar solo el access token
    refreshTokenData = {
      token: null,
      refreshTokenId: null,
      expiresAt: null
    };
  }

  // Preparar datos del usuario sin información sensible
  const safeUserData = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    avatar: userData.avatar,
    university: userData.university,
    career: userData.career,
    semester: userData.semester,
    level: userData.level,
    xp: userData.xp,
    streak: userData.streak,
    study_hours: userData.study_hours,
    role: userData.role,
    is_active: userData.is_active,
    preferences: userData.preferences,
    total_sessions: userData.total_sessions,
    total_groups: userData.total_groups,
    email_verified: userData.email_verified
  };

  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: {
      user: safeUserData,
      token: accessToken,
      refreshToken: refreshTokenData.token,
      expiresAt: refreshTokenData.expiresAt,
      supabaseSession: authData?.session || null
    }
  });
}));

// @route   POST /api/auth/logout
// @desc    Cerrar sesión
// @access  Private (pero permitimos sin token para casos donde el token ya expiró)
router.post('/logout', asyncHandler(async (req, res) => {
  const authHeader = req.header('Authorization');
  const { refreshToken } = req.body;

  let userId = null;

  // Si hay token, obtener el userId y blacklistear el token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);

      // Intentar decodificar token (puede estar expirado)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId || decoded.sub;

        // Blacklistear el access token
        await TokenBlacklistService.blacklistToken(token, userId, 'logout', 'access');
      } catch (jwtError) {
        // Token expirado o inválido, pero aún así intentar blacklistearlo
        try {
          const decoded = jwt.decode(token);
          if (decoded?.userId) {
            userId = decoded.userId;
            await TokenBlacklistService.blacklistToken(token, userId, 'logout', 'access');
          }
        } catch (decodeError) {
          // Ignorar errores de decodificación
        }
      }
    } catch (error) {
      // Continuar con el logout aunque falle el blacklist
    }
  }

  // Revocar refresh token si se proporciona
  if (refreshToken) {
    try {
      await RefreshTokenService.revokeRefreshToken(refreshToken);
    } catch (error) {
      // Continuar aunque falle la revocación
    }
  }

  // Si tenemos userId, revocar todos los refresh tokens del usuario
  if (userId) {
    try {
      await RefreshTokenService.revokeAllUserTokens(userId);
      // Actualizar last_active antes de cerrar sesión
      await supabaseAdmin
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      // Continuar aunque falle
    }
  }

  // Cerrar sesión en Supabase
  try {
    await supabase.auth.signOut();
  } catch (error) {
    // Continuar aunque falle
  }

  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
}));

// @route   POST /api/auth/refresh
// @desc    Refrescar access token usando refresh token
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createAuthError('Refresh token requerido');
  }

  // Verificar refresh token
  const tokenData = await RefreshTokenService.verifyRefreshToken(refreshToken);

  if (!tokenData) {
    throw createAuthError('Refresh token inválido o expirado');
  }

  const { userId, user } = tokenData;

  // Verificar que el usuario esté activo
  if (!user.is_active) {
    throw new AppError('Tu cuenta ha sido desactivada por un administrador. Por favor, contacta al soporte si crees que esto es un error.', 403);
  }

  // Generar nuevo access token
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  // Crear nuevo refresh token (sin rotación porque no hay persistencia)
  const deviceInfo = {
    userAgent: req.headers['user-agent'] || '',
    platform: req.headers['sec-ch-ua-platform'] || 'unknown'
  };

  let newRefreshTokenData;
  try {
    newRefreshTokenData = await RefreshTokenService.createRefreshToken(
      userId,
      deviceInfo,
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent']
    );
  } catch (createError) {
    throw new AppError('Error generando nuevo refresh token', 500);
  }

  // Actualizar última actividad
  await supabaseAdmin
    .from('users')
    .update({ last_active: new Date().toISOString() })
    .eq('id', userId);

  res.json({
    success: true,
    message: 'Token renovado exitosamente',
    data: {
      token: accessToken,
      refreshToken: newRefreshTokenData.token,
      expiresAt: newRefreshTokenData.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }
  });
}));

// @route   POST /api/auth/forgot-password
// @desc    Solicitar reset de contraseña
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Email inválido', errors.array());
  }

  const { email } = req.body;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`
  });

  if (error) {
    throw new AppError('Error enviando email de recuperación', 500);
  }

  res.json({
    success: true,
    message: 'Se ha enviado un email con instrucciones para restablecer tu contraseña'
  });
}));

// @route   POST /api/auth/reset-password
// @desc    Restablecer contraseña
// @access  Public
router.post('/reset-password', [
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('access_token').notEmpty().withMessage('Token de acceso requerido')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createValidationError('Datos inválidos', errors.array());
  }

  const { password, access_token } = req.body;

  // Verificar token y actualizar contraseña en Supabase
  const { data, error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    throw new AppError('Error actualizando contraseña: ' + error.message, 400);
  }

  // Actualizar hash de contraseña en nuestra tabla
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  await supabase
    .from('users')
    .update({
      password_hash: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null
    })
    .eq('id', data.user.id);

  res.json({
    success: true,
    message: 'Contraseña actualizada exitosamente'
  });
}));

// @route   GET /api/auth/me
// @desc    Obtener usuario actual
// @access  Private (pero manejado aquí para conveniencia)
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createAuthError('Token de acceso requerido');
  }

  const token = authHeader.substring(7);

  // Verificar token JWT primero
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.sub;

    if (!userId) {
      throw createAuthError('Token inválido');
    }

    // Obtener datos del usuario usando supabaseAdmin para bypass RLS
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id, email, name, avatar, university, career, semester,
        level, xp, streak, study_hours, role, is_active,
        preferences, total_sessions, total_groups, last_active,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw createNotFoundError('Usuario no encontrado');
    }

    res.json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (jwtError) {
    // Si el JWT falla, intentar con Supabase Auth como fallback
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw createAuthError('Token inválido');
      }

      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select(`
      id, email, name, avatar, university, career, semester,
      level, xp, streak, study_hours, role, is_active,
      preferences, total_sessions, total_groups, last_active,
      created_at
    `)
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw createNotFoundError('Usuario no encontrado');
      }

      res.json({
        success: true,
        data: {
          user: userData
        }
      });
    } catch (authError) {
      throw createAuthError('Token inválido');
    }
  }
}));

module.exports = router;