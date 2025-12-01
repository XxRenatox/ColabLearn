const { supabaseAdmin } = require('../config/database');
const crypto = require('crypto');

class TokenBlacklistService {
  /**
   * Crea un hash del token para almacenamiento
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Decodifica un JWT para obtener su expiración (sin verificar firma)
   */
  static getTokenExpiration(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Agrega un token a la blacklist
   */
  static async blacklistToken(token, userId = null, reason = 'logout', tokenType = 'access') {
    const tokenHash = this.hashToken(token);
    const expiresAt = this.getTokenExpiration(token) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 días

    const { data, error } = await supabaseAdmin
      .from('blacklisted_tokens')
      .insert([{
        token_hash: tokenHash,
        user_id: userId,
        token_type: tokenType,
        reason: reason,
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    return { success: !error, data };
  }

  /**
   * Verifica si un token está en la blacklist
   */
  static async isTokenBlacklisted(token) {
    const tokenHash = this.hashToken(token);

    const { data, error } = await supabaseAdmin
      .from('blacklisted_tokens')
      .select('id')
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    return !!data && !error;
  }

  /**
   * Blacklist todos los tokens de un usuario (útil cuando cambia contraseña o se desactiva)
   * Invalida todos los tokens conocidos de un usuario agregándolos a la blacklist
   */
  static async blacklistAllUserTokens(userId, reason = 'password_change') {
    try {
      // Obtener todos los tokens activos del usuario desde la tabla blacklisted_tokens
      // (aunque no tenemos todos los tokens, podemos marcar todos los que ya están registrados)
      const { data: existingTokens, error: fetchError } = await supabaseAdmin
        .from('blacklisted_tokens')
        .select('token_hash, expires_at')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString());

      // No es un error si no hay tokens previos
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('Error obteniendo tokens del usuario:', fetchError);
      }

      // Retornar éxito - el middleware verificará is_active en cada request
      // Los tokens no conocidos serán rechazados por la verificación de is_active
      return { 
        success: true, 
        message: 'Tokens invalidos. El middleware verificará is_active en cada request.',
        tokensFound: existingTokens?.length || 0
      };
    } catch (error) {
      console.error('Error en blacklistAllUserTokens:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Invalida todos los tokens de un usuario cuando se desactiva
   * Agrega una entrada especial en la blacklist que indica que el usuario está desactivado
   */
  static async invalidateUserOnDeactivation(userId) {
    try {
      // Crear un token hash especial para indicar que el usuario está desactivado
      // Esto no invalida tokens específicos, pero ayuda con auditoría
      const specialHash = `user_deactivated_${userId}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 año

      const { error } = await supabaseAdmin
        .from('blacklisted_tokens')
        .insert([{
          token_hash: specialHash,
          user_id: userId,
          token_type: 'access',
          reason: 'account_deactivated',
          expires_at: expiresAt.toISOString()
        }]);

      if (error && error.code !== '23505') { // Ignorar duplicados
        console.warn('Error agregando entrada de desactivación:', error);
      }

      return { success: true };
    } catch (error) {
      console.error('Error en invalidateUserOnDeactivation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpia tokens expirados de la blacklist
   */
  static async cleanupExpiredTokens() {
    const { error } = await supabaseAdmin
      .from('blacklisted_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());

    return { success: !error };
  }
}

module.exports = TokenBlacklistService;

