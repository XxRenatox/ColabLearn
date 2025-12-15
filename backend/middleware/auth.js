const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/database');
const TokenBlacklistService = require('../services/tokenBlacklistService');

const auth = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar si el token está en la blacklist
    const isBlacklisted = await TokenBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o sesión cerrada'
      });
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido - no se pudo extraer ID de usuario'
      });
    }

    // Obtener datos del usuario desde la base de datos (usar supabaseAdmin para bypass RLS)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      // Si el usuario está desactivado, agregar su token a la blacklist para invalidarlo
      try {
        await TokenBlacklistService.blacklistToken(token, userId, 'account_deactivated', 'access');
      } catch (blacklistError) {
        // Continuar aunque falle el blacklist - ya estamos rechazando el request

      }

      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada por un administrador. Por favor, contacta al soporte si crees que esto es un error.'
      });
    }

    // Actualizar última actividad del usuario (usar supabaseAdmin para bypass RLS)
    await supabaseAdmin
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId);

    // Añadir información del usuario a la request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      university: user.university,
      career: user.career,
      semester: user.semester,
      level: user.level,
      xp: user.xp,
      streak: user.streak
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes'
      });
    }

    next();
  };
};

// Middleware opcional - no falla si no hay token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData && userData.is_active) {
        req.user = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          university: userData.university,
          career: userData.career,
          semester: userData.semester
        };
      }
    }

    next();
  } catch (error) {
    // En auth opcional, no fallar - continuar sin usuario
    next();
  }
};

module.exports = {
  auth,
  requireRole,
  optionalAuth
};