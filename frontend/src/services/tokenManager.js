const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at';
const REFRESH_TOKEN_EXPIRES_AT_KEY = 'refresh_token_expires_at';

// Verificar si estamos en el navegador (no SSR)
const isBrowser = typeof window !== 'undefined';

/**
 * Decodifica un JWT sin verificar la firma (solo para obtener expiración)
 */
const decodeToken = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    return null;
  }
};

/**
 * Verifica si un token está próximo a expirar (en los próximos 5 minutos)
 */
const isTokenExpiringSoon = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return false;

  const expirationTime = decoded.exp * 1000; // Convertir a milisegundos
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return (expirationTime - now) < fiveMinutes;
};

/**
 * Verifica si un token ya expiró
 */
const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const expirationTime = decoded.exp * 1000;
  const now = Date.now();

  return expirationTime < now;
};

/**
 * Guarda un valor en localStorage de forma segura
 */
const safeSetItem = (key, value) => {
  if (!isBrowser) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {

    return false;
  }
};

/**
 * Obtiene un valor de localStorage de forma segura
 */
const safeGetItem = (key) => {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {

    return null;
  }
};

/**
 * Elimina un valor de localStorage de forma segura
 */
const safeRemoveItem = (key) => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {

  }
};

/**
 * Guarda tokens de autenticación
 */
export const setAuthTokens = (accessToken, refreshToken, refreshTokenExpiresAt) => {
  if (!isBrowser) return;

  if (!accessToken) {
    clearAuthToken();
    return;
  }

  // Guardar access token
  safeSetItem(TOKEN_KEY, accessToken);

  // Guardar refresh token si se proporciona
  if (refreshToken) {
    safeSetItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  // Guardar fecha de expiración del refresh token
  if (refreshTokenExpiresAt) {
    safeSetItem(REFRESH_TOKEN_EXPIRES_AT_KEY, refreshTokenExpiresAt);
  }

  // Calcular y guardar expiración del access token
  const decoded = decodeToken(accessToken);
  if (decoded?.exp) {
    safeSetItem(TOKEN_EXPIRES_AT_KEY, decoded.exp.toString());
  }
};

/**
 * Obtiene el access token
 */
export const getAuthToken = () => {
  return safeGetItem(TOKEN_KEY);
};

/**
 * Obtiene el refresh token
 */
export const getRefreshToken = () => {
  return safeGetItem(REFRESH_TOKEN_KEY);
};

/**
 * Limpia todos los tokens
 */
export const clearAuthToken = () => {
  safeRemoveItem(TOKEN_KEY);
  safeRemoveItem(REFRESH_TOKEN_KEY);
  safeRemoveItem(TOKEN_EXPIRES_AT_KEY);
  safeRemoveItem(REFRESH_TOKEN_EXPIRES_AT_KEY);
};

// Alias para compatibilidad
export const clearAuthTokens = clearAuthToken;

/**
 * Verifica si el access token está próximo a expirar
 */
export const shouldRefreshToken = () => {
  const token = getAuthToken();
  if (!token) return false;
  return isTokenExpiringSoon(token);
};

/**
 * Verifica si el access token ya expiró
 */
export const isAccessTokenExpired = () => {
  const token = getAuthToken();
  if (!token) return true;
  return isTokenExpired(token);
};

/**
 * Renueva el access token usando el refresh token
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No hay refresh token disponible');
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error renovando token');
    }

    const data = await response.json();

    if (data.success && data.data) {
      // Actualizar tokens
      setAuthTokens(
        data.data.token,
        data.data.refreshToken,
        data.data.expiresAt
      );

      return {
        token: data.data.token,
        refreshToken: data.data.refreshToken,
        expiresAt: data.data.expiresAt
      };
    }

    throw new Error('Respuesta inválida del servidor');
  } catch (error) {
    // Si falla la renovación, limpiar tokens
    clearAuthToken();
    throw error;
  }
};

/**
 * Obtiene información sobre los tokens almacenados
 */
export const getTokenInfo = () => {
  const accessToken = getAuthToken();
  const refreshToken = getRefreshToken();
  const tokenExpiresAt = safeGetItem(TOKEN_EXPIRES_AT_KEY);
  const refreshTokenExpiresAt = safeGetItem(REFRESH_TOKEN_EXPIRES_AT_KEY);

  const decoded = accessToken ? decodeToken(accessToken) : null;

  return {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenExpired: accessToken ? isTokenExpired(accessToken) : true,
    accessTokenExpiringSoon: accessToken ? isTokenExpiringSoon(accessToken) : false,
    accessTokenExpiresAt: decoded?.exp ? new Date(decoded.exp * 1000) : null,
    refreshTokenExpiresAt: refreshTokenExpiresAt ? new Date(refreshTokenExpiresAt) : null,
    userId: decoded?.userId || null
  };
};

// Mantener compatibilidad con código existente
export const setAuthToken = (token) => {
  setAuthTokens(token, null, null);
};
