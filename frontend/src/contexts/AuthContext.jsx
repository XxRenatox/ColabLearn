import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { setAuthTokens, clearAuthToken, getAuthToken, getRefreshToken } from '@/services/tokenManager';
import { useToast } from '@/components/ui/Toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // useNavigate debe ser llamado incondicionalmente
  const navigate = useNavigate();
  
  // Obtener toast (AuthProvider está dentro de ToastProvider en App.jsx)
  const toast = useToast();

  // Verificar si el usuario está autenticado al cargar la aplicación
  useEffect(() => {
    let isMounted = true;
    
    const loadUser = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // Configurar header de autorización
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Intentar cargar usuario
        const response = await api.get('/auth/me');
        const userData = response.data?.data?.user || response.data?.user || null;
        
        if (isMounted) {
          if (userData) {
            setCurrentUser(userData);
            setError(null);
          } else {
            // Si no hay usuario en la respuesta, limpiar tokens
            clearAuthToken();
            delete api.defaults.headers.common['Authorization'];
            setCurrentUser(null);
          }
          setLoading(false);
        }
      } catch (err) {
        // Manejar errores de autenticación (401) y cuenta desactivada (403)
        if (isMounted) {
          const isAuthError = err.response?.status === 401;
          const isAccountDeactivated = err.response?.status === 403 && 
            (err.response?.data?.message?.toLowerCase().includes('cuenta desactivada') ||
             err.response?.data?.message?.toLowerCase().includes('desactivada'));
          
          if (isAuthError || isAccountDeactivated) {
            // Limpiar tokens y cerrar sesión
            clearAuthToken();
            delete api.defaults.headers.common['Authorization'];
            setCurrentUser(null);
            setError(null);
            
            // Si es cuenta desactivada, mostrar toast y redirigir
            if (isAccountDeactivated && typeof window !== 'undefined') {
              const deactivationMessage = err.response?.data?.message || 'Tu cuenta ha sido desactivada por un administrador. Por favor, contacta al soporte si crees que esto es un error.';
              
              // Guardar mensaje para mostrarlo en la página de login
              sessionStorage.setItem('account_deactivated_message', deactivationMessage);
              
              // Mostrar toast
              toast.error(
                'Cuenta Desactivada',
                deactivationMessage,
                { duration: 5000 }
              );
              
              // Redirigir después de un breve delay para mostrar el mensaje
              setTimeout(() => {
                window.location.href = '/login';
              }, 3000);
            }
          } else {
            // Error de red u otro tipo - mantener el token silenciosamente
            // No mostrar advertencias al usuario en segundo plano
          }
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  // Iniciar sesión
  const login = useCallback(async (credentials) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', credentials);
      const payload = response.data?.data || response.data || {};
      const { token, refreshToken, expiresAt, user } = payload;

      if (!token || !user) {
        throw new Error(response.data?.message || 'Credenciales inválidas');
      }
      
      // Guardar tokens (access token y refresh token)
      setAuthTokens(token, refreshToken, expiresAt);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(user);
      setError(null);
      
      return user;
    } catch (err) {
      // Manejar específicamente el caso de cuenta desactivada
      const isAccountDeactivated = err.response?.status === 403 && 
        (err.response?.data?.message?.toLowerCase().includes('cuenta desactivada') ||
         err.response?.data?.message?.toLowerCase().includes('desactivada'));
      
      const errorMessage = isAccountDeactivated 
        ? (err.response?.data?.message || 'Tu cuenta ha sido desactivada por un administrador. Por favor, contacta al soporte si crees que esto es un error.')
        : (err.response?.data?.message || err.message || 'Error al iniciar sesión');
      
      setError(errorMessage);
      clearAuthToken();
      delete api.defaults.headers.common['Authorization'];
      
      // Guardar mensaje de desactivación para mostrarlo en la página de login
      if (isAccountDeactivated && typeof window !== 'undefined') {
        sessionStorage.setItem('account_deactivated_message', errorMessage);
      }
      
      throw err;
    }
  }, []);

  // Cerrar sesión
  const logout = useCallback(async () => {
    try {
      // Limpiar estado primero para evitar verificaciones innecesarias
      setCurrentUser(null);
      setError(null);
      setLoading(false); // Evitar que se muestre loading durante logout
      
      const refreshToken = getRefreshToken();
      
      // Intentar cerrar sesión en el backend (no bloquear si falla, hacerlo en segundo plano)
      if (refreshToken) {
        // Hacer logout en segundo plano sin bloquear
        api.post('/auth/logout', { refreshToken }).catch(() => {
          // Silenciar errores de logout del servidor
        });
      }
      
      // Limpiar tokens y headers
      clearAuthToken();
      delete api.defaults.headers.common['Authorization'];
      
      // Redirigir inmediatamente sin esperar respuesta del servidor
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Error durante logout:', err);
      // Aún así, limpiar el estado local y redirigir
      clearAuthToken();
      setCurrentUser(null);
      setLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  // Actualizar información del usuario
  const updateUser = useCallback((userData) => {
    setCurrentUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  }, []);

  // Registrar nuevo usuario
  const register = useCallback(async (userData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', userData);
      const payload = response.data?.data || response.data || {};
      const { token, refreshToken, expiresAt, user } = payload;

      if (!token || !user) {
        return response.data;
      }

      // Guardar tokens (access token y refresh token)
      setAuthTokens(token, refreshToken, expiresAt);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(user);
      setError(null);
      
      return { success: true, user };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al registrar usuario';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    error,
    login,
    logout,
    register,
    updateUser,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
