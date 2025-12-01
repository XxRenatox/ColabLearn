const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Servicio de Refresh Tokens sin persistencia en base de datos
 * Los refresh tokens son JWT firmados que se pueden verificar sin necesidad de BD
 */
class RefreshTokenService {
  /**
   * Genera un refresh token seguro como JWT
   */
  static generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Crea un nuevo refresh token para un usuario (sin persistencia)
   * Los refresh tokens son JWT firmados con información del usuario
   */
  static async createRefreshToken(userId, deviceInfo = {}, ipAddress = null, userAgent = null) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no está configurado');
    }

    const token = this.generateRefreshToken();
    
    // Refresh tokens expiran en 30 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Crear un JWT con el refresh token como payload
    // Esto permite verificar el token sin necesidad de base de datos
    const refreshTokenJWT = jwt.sign(
      {
        type: 'refresh',
        userId: userId,
        token: token, // Token aleatorio único
        deviceInfo: deviceInfo,
        ipAddress: ipAddress,
        userAgent: userAgent
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      token: refreshTokenJWT, // JWT que contiene toda la información
      refreshTokenId: null, // No hay ID porque no hay persistencia
      expiresAt: expiresAt.toISOString()
    };
  }

  /**
   * Verifica y obtiene información de un refresh token
   * Verifica el JWT sin necesidad de base de datos
   */
  static async verifyRefreshToken(refreshToken) {
    if (!process.env.JWT_SECRET) {
      return null;
    }

    try {
      // Verificar el JWT
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      // Verificar que sea un refresh token
      if (decoded.type !== 'refresh') {
        return null;
      }

      // Obtener información del usuario desde la base de datos
      const { supabaseAdmin } = require('../config/database');
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, is_active')
        .eq('id', decoded.userId)
        .maybeSingle();

      if (userError || !userData) {
        return null;
      }

      // Verificar que el usuario esté activo
      if (!userData.is_active) {
        return null;
      }

      return {
        refreshTokenId: null, // No hay ID porque no hay persistencia
        userId: decoded.userId,
        user: userData
      };
    } catch (error) {
      // Token inválido o expirado
      return null;
    }
  }

  /**
   * Revoca un refresh token específico
   * Sin persistencia, esto es solo para compatibilidad con el código existente
   */
  static async revokeRefreshToken(token) {
    // Sin persistencia, no hay nada que revocar
    // El token seguirá siendo válido hasta que expire
    // En un sistema real, esto debería agregar el token a una blacklist
    return { success: true, data: null };
  }

  /**
   * Revoca todos los refresh tokens de un usuario
   * Sin persistencia, esto es solo para compatibilidad
   */
  static async revokeAllUserTokens(userId) {
    // Sin persistencia, no hay nada que revocar
    return { success: true };
  }

  /**
   * Rota un refresh token (invalida el anterior y crea uno nuevo)
   * Sin persistencia, simplemente crea un nuevo token
   */
  static async rotateRefreshToken(oldToken, userId, deviceInfo = {}, ipAddress = null, userAgent = null) {
    // Verificar el token antiguo
    const tokenData = await this.verifyRefreshToken(oldToken);
    if (!tokenData || tokenData.userId !== userId) {
      throw new Error('Refresh token inválido');
    }

    // Crear nuevo token (sin invalidar el anterior porque no hay persistencia)
    return await this.createRefreshToken(userId, deviceInfo, ipAddress, userAgent);
  }

  /**
   * Limpia tokens expirados
   * Sin persistencia, no hay nada que limpiar
   */
  static async cleanupExpiredTokens() {
    return { success: true };
  }
}

module.exports = RefreshTokenService;
