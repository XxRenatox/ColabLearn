import { getAuthToken, refreshAccessToken, shouldRefreshToken, isAccessTokenExpired, clearAuthTokens } from '@/services/tokenManager';

// Guardar mensaje de cuenta desactivada para mostrarlo después
const setDeactivationMessage = (message) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('account_deactivated_message', message);
  }
};

let isRefreshing = false;
let failedQueue = [];

/**
 * Procesa la cola de requests fallidos después de renovar el token
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Interceptor para renovar tokens automáticamente antes de que expiren
 */
export const setupTokenRefresh = (axiosInstance) => {
  // Interceptor de request - verificar y renovar token si es necesario
  axiosInstance.interceptors.request.use(
    async (config) => {
      const token = getAuthToken();

      if (token) {
        // Si el token está próximo a expirar o ya expiró, renovarlo
        if (shouldRefreshToken() || isAccessTokenExpired()) {
          if (!isRefreshing) {
            isRefreshing = true;

            try {
              const newTokens = await refreshAccessToken();
              processQueue(null, newTokens.token);
              config.headers.Authorization = `Bearer ${newTokens.token}`;
              isRefreshing = false;
            } catch (error) {
              processQueue(error, null);
              isRefreshing = false;
              // No lanzar error aquí, dejar que el request continúe
              // El interceptor de response manejará el 401
            }
          } else {
            // Si ya se está renovando, esperar en la cola
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(token => {
              config.headers.Authorization = `Bearer ${token || getAuthToken()}`;
              return config;
            }).catch(error => {
              return Promise.reject(error);
            });
          }
        } else {
          // Token válido, usar normalmente
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor de response - manejar 401 y 403 (cuenta desactivada)
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Si es un 403 con mensaje de cuenta desactivada, cerrar sesión
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.message || '';
        if (errorMessage.toLowerCase().includes('cuenta desactivada') ||
          errorMessage.toLowerCase().includes('desactivada') ||
          errorMessage.toLowerCase().includes('account deactivated')) {

          // Guardar mensaje para mostrarlo en la página de login
          setDeactivationMessage(errorMessage || 'Tu cuenta ha sido desactivada por un administrador.');

          // Limpiar tokens
          clearAuthTokens();
          delete axiosInstance.defaults.headers.common['Authorization'];

          // Redirigir a login (el toast se mostrará en la página de login)
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }

          return Promise.reject(error);
        }
      }

      // Si es un 401 y no es un request de refresh ni de login, intentar renovar
      if (error.response?.status === 401 && !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/refresh') &&
        !originalRequest.url?.includes('/auth/login')) {
        if (isRefreshing) {
          // Ya se está renovando, esperar en la cola
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token || getAuthToken()}`;
            return axiosInstance.request(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newTokens = await refreshAccessToken();
          processQueue(null, newTokens.token);

          originalRequest.headers.Authorization = `Bearer ${newTokens.token}`;
          isRefreshing = false;

          // Reintentar el request original
          return axiosInstance.request(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          // Si falla la renovación, limpiar tokens y redirigir
          clearAuthTokens();

          // Redirigir a login solo si no estamos ya ahí
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            window.location.href = '/login';
          }

          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

