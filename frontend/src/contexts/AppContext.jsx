import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { authAPI, usersAPI, groupsAPI, sessionsAPI, notificationsAPI, achievementsAPI } from '@/services/api';
import { setAuthToken, clearAuthToken, getAuthToken } from '@/services/tokenManager';

const extractResponseData = (response) => {
  if (!response || typeof response !== 'object') {
    return response;
  }

  if ('data' in response && response.data !== undefined) {
    return response.data;
  }

  if ('success' in response && response.success && response.data) {
    return response.data;
  }

  return response;
};

const initialState = {
  // Usuario y autenticación
  user: null,
  token: getAuthToken() || null,
  isAuthenticated: false,
  
  // Datos del dashboard
  groups: [],
  sessions: [],
  notifications: [],
  achievements: [],
  userAchievements: [],
  
  // Estados de carga
  loading: {
    user: false,
    groups: false,
    sessions: false,
    notifications: false,
    achievements: false,
  },
  
  // Errores
  errors: {},
  
  // Socket.IO
  socket: null,
  isConnected: false,
};

// Tipos de acciones
const ACTIONS = {
  // Autenticación
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  LOGOUT: 'LOGOUT',
  
  // Loading states
  SET_LOADING: 'SET_LOADING',
  
  // Datos
  SET_GROUPS: 'SET_GROUPS',
  SET_SESSIONS: 'SET_SESSIONS',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_ACHIEVEMENTS: 'SET_ACHIEVEMENTS',
  SET_USER_ACHIEVEMENTS: 'SET_USER_ACHIEVEMENTS',
  
  // Errores
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Socket
  SET_SOCKET: 'SET_SOCKET',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  
  // Actualizaciones en tiempo real
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_GROUP: 'UPDATE_GROUP',
  UPDATE_SESSION: 'UPDATE_SESSION',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: Boolean(action.payload && (state.token || getAuthToken())),
      };
      
    case ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload,
        isAuthenticated: Boolean(action.payload && state.user),
      };
    
    case ACTIONS.LOGOUT:
      return {
        ...initialState,
        user: null,
        token: null,
        isAuthenticated: false,
      };
      
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
      
    case ACTIONS.SET_GROUPS:
      return {
        ...state,
        groups: action.payload,
      };
      
    case ACTIONS.SET_SESSIONS:
      return {
        ...state,
        sessions: action.payload,
      };
      
    case ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
      };
      
    case ACTIONS.SET_ACHIEVEMENTS:
      return {
        ...state,
        achievements: action.payload,
      };
      
    case ACTIONS.SET_USER_ACHIEVEMENTS:
      return {
        ...state,
        userAchievements: action.payload,
      };
      
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error,
        },
      };
      
    case ACTIONS.CLEAR_ERROR:
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return {
        ...state,
        errors: newErrors,
      };
      
      
    case ACTIONS.SET_SOCKET:
      return {
        ...state,
        socket: action.payload,
      };
      
    case ACTIONS.SET_CONNECTION_STATUS:
      return {
        ...state,
        isConnected: action.payload,
      };
      
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
      
    case ACTIONS.UPDATE_GROUP:
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === action.payload.id ? { ...group, ...action.payload } : group
        ),
      };
      
    case ACTIONS.UPDATE_SESSION:
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id ? { ...session, ...action.payload } : session
        ),
      };
      
    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const hasLoadedUserRef = useRef(false);

  // Funciones de autenticación
  const login = async (credentials) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'user', value: true } });

      const response = await authAPI.login(credentials);
      const payload = extractResponseData(response);
      const { user, token } = payload || {};

      if (token) {
        setAuthToken(token);
        dispatch({ type: ACTIONS.SET_TOKEN, payload: token });
      }

      if (user) {
        dispatch({ type: ACTIONS.SET_USER, payload: user });
      }

      return response;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: { key: 'auth', error: error.message } });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'user', value: false } });
    }
  };

  // Registro
  const register = async (userData) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'user', value: true } });

      const response = await authAPI.register(userData);
      const payload = extractResponseData(response);
      const { user, token } = payload || {};

      if (token) {
        setAuthToken(token);
        dispatch({ type: ACTIONS.SET_TOKEN, payload: token });
      }

      if (user) {
        dispatch({ type: ACTIONS.SET_USER, payload: user });
      }

      return response;
    } catch (error) {
      const errorMessage = error.message || 'Error al registrar usuario';
      dispatch({ type: ACTIONS.SET_ERROR, payload: { key: 'auth', error: errorMessage } });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'user', value: false } });
    }
  };

  const logout = async () => {
    try {
      // Desconectar socket antes del logout
      if (state.socket) {
        state.socket.disconnect();
      }
      
      await authAPI.logout();
    } catch (error) {
      // Error durante logout
    } finally {
      clearAuthToken();
      dispatch({ type: ACTIONS.LOGOUT });
    }
  };

  // Funciones para cargar datos
  const loadGroups = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'groups', value: true } });
      const response = await groupsAPI.getGroups();
      const payload = extractResponseData(response);
      let parsed = undefined;
      if (payload && typeof payload === 'object') {
        if (Array.isArray(payload)) {
          parsed = payload;
        } else if (Array.isArray(payload.groups)) {
          parsed = payload.groups;
        } else if (payload.data) {
          if (Array.isArray(payload.data)) parsed = payload.data;
          else if (Array.isArray(payload.data?.groups)) parsed = payload.data.groups;
        }
      }
      if (Array.isArray(parsed)) {
        dispatch({ type: ACTIONS.SET_GROUPS, payload: parsed });
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: { key: 'groups', error: error.message } });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'groups', value: false } });
    }
  };

  const loadSessions = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'sessions', value: true } });
      const response = await sessionsAPI.getSessions();
      const payload = extractResponseData(response);
      const sessions = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.sessions)
          ? payload.sessions
          : Array.isArray(payload?.data?.sessions)
            ? payload.data.sessions
            : [];
      dispatch({ type: ACTIONS.SET_SESSIONS, payload: sessions });
      return sessions;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: { key: 'sessions', error: error.message } });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'sessions', value: false } });
    }
  };

  const loadNotifications = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'notifications', value: true } });
      const response = await notificationsAPI.getNotifications();
      const payload = extractResponseData(response);
      const notifications = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.notifications)
          ? payload.notifications
          : Array.isArray(payload?.data?.notifications)
            ? payload.data.notifications
            : [];
      dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: notifications });
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: { key: 'notifications', error: error.message } });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'notifications', value: false } });
    }
  };

  const loadAchievements = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'achievements', value: true } });
      const [achievementsResponse, userAchievementsResponse] = await Promise.all([
        achievementsAPI.getAchievements(),
        achievementsAPI.getUserAchievements()
      ]);
      
      const achievementsPayload = extractResponseData(achievementsResponse);
      const userAchievementsPayload = extractResponseData(userAchievementsResponse);

      const achievements = Array.isArray(achievementsPayload)
        ? achievementsPayload
        : Array.isArray(achievementsPayload?.achievements)
          ? achievementsPayload.achievements
          : Array.isArray(achievementsPayload?.data?.achievements)
            ? achievementsPayload.data.achievements
            : [];

      // Extraer userAchievements - el backend devuelve { success: true, data: { achievements: [...] } }
      // Después de extractResponseData, userAchievementsPayload debería ser { achievements: [...] }
      let userAchievements = [];
      if (Array.isArray(userAchievementsPayload)) {
        // Si es un array directo
        userAchievements = userAchievementsPayload;
      } else if (userAchievementsPayload && typeof userAchievementsPayload === 'object') {
        // Si es un objeto, buscar el array en diferentes propiedades posibles
        if (Array.isArray(userAchievementsPayload.achievements)) {
          userAchievements = userAchievementsPayload.achievements;
        } else if (Array.isArray(userAchievementsPayload.data?.achievements)) {
          userAchievements = userAchievementsPayload.data.achievements;
        } else if (Array.isArray(userAchievementsPayload.data)) {
          userAchievements = userAchievementsPayload.data;
        }
      }
      
      dispatch({ type: ACTIONS.SET_ACHIEVEMENTS, payload: achievements });
      dispatch({ type: ACTIONS.SET_USER_ACHIEVEMENTS, payload: userAchievements });
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: { key: 'achievements', error: error.message } });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'achievements', value: false } });
    }
  };

  // Cargar todos los datos del usuario
  const loadUserData = async () => {
    if (!getAuthToken() || !state.isAuthenticated) {
      return;
    }

    await Promise.all([
      loadGroups(),
      loadSessions(),
      loadNotifications(),
      loadAchievements(),
    ]);
  };

  // Socket.IO setup
  const initializeSocket = () => {
    if (typeof window !== 'undefined' && state.isAuthenticated && state.token) {
      try {
        import('socket.io-client').then(({ io }) => {
          const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
            auth: {
              token: state.token,
            },
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            maxReconnectionAttempts: 5,
            upgrade: true,
            rememberUpgrade: true,
          });

          socket.on('connect', () => {
            dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: true });
            socket.emit('authenticate', { userId: state.user?.id });
          });

          socket.on('disconnect', (reason) => {
            dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: false });
          });

          socket.on('connect_error', (error) => {
            dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: false });
          });

          socket.on('reconnect', (attemptNumber) => {
            dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: true });
          });

          socket.on('reconnect_error', (error) => {
            // Error de reconexión
          });

          socket.on('notification', (notification) => {
            dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification });
          });

          socket.on('session-updated', (data) => {
            // Recargar sesiones cuando se actualiza una sesión
            if (state.user?.id) {
              loadSessions();
            }
          });

          socket.on('group-update', (update) => {
            dispatch({ type: ACTIONS.UPDATE_GROUP, payload: update });
          });

          socket.on('session-update', (update) => {
            dispatch({ type: ACTIONS.UPDATE_SESSION, payload: update });
          });

          dispatch({ type: ACTIONS.SET_SOCKET, payload: socket });
        }).catch((error) => {
          // Error cargando Socket.IO
        });
      } catch (error) {
        // Error inicializando Socket.IO
      }
    }
  };

  // Cargar usuario al iniciar si hay token guardado (solo una vez)
  useEffect(() => {
    // Evitar ejecuciones múltiples
    if (hasLoadedUserRef.current) {
      return;
    }

    const token = getAuthToken();
    if (token) {
      hasLoadedUserRef.current = true;
      
      // Hay token, intentar cargar usuario
      dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'user', value: true } });
      
      authAPI.getMe()
        .then((response) => {
          const payload = extractResponseData(response);
          const user = payload?.user || payload;
          if (user) {
            dispatch({ type: ACTIONS.SET_USER, payload: user });
            dispatch({ type: ACTIONS.SET_TOKEN, payload: token });
          } else {
            // Si no hay usuario en la respuesta, limpiar token
            clearAuthToken();
            dispatch({ type: ACTIONS.LOGOUT });
          }
        })
        .catch((error) => {
          // Solo limpiar token si es un error de autenticación (401)
          // No limpiar si es error de red u otro tipo de error
          const isAuthError = error.response?.status === 401 || error.status === 401;
          
          if (isAuthError) {
            console.warn('Token inválido o expirado:', error);
            clearAuthToken();
            dispatch({ type: ACTIONS.LOGOUT });
          } else {
            // Error de red u otro tipo - mantener el token
            console.warn('Error cargando usuario (manteniendo sesión):', error);
            // No limpiar el token, podría ser un problema temporal de red
          }
        })
        .finally(() => {
          dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'user', value: false } });
        });
    } else {
      // Si no hay token, marcar como cargado para evitar reintentos
      hasLoadedUserRef.current = true;
    }
  }, []); // Solo ejecutar una vez al montar

  // Cargar datos cuando el usuario se autentica
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      loadUserData();
      initializeSocket();
    }

    // Cleanup socket cuando el usuario se desautentica
    return () => {
      if (state.socket) {
        state.socket.disconnect();
      }
    };
  }, [state.isAuthenticated, state.user]);

  // Actualizar usuario en el contexto
  const updateUser = async (updates = {}) => {
    try {
      // Si hay actualizaciones, hacer la petición al backend
      if (Object.keys(updates).length > 0) {
        const response = await usersAPI.updateProfile(updates);
        const payload = extractResponseData(response);
        const updatedUserData = payload?.user || payload;
        
        if (updatedUserData) {
          // Actualizar el usuario en el estado con los nuevos datos
          // Asegurarse de que state.user existe antes de hacer spread
          const currentUser = state.user || {};
          dispatch({ 
            type: ACTIONS.SET_USER, 
            payload: { ...currentUser, ...updatedUserData } 
          });
          return updatedUserData;
        }
      }
      
      // Si no hay actualizaciones, solo recargar el perfil completo
      const response = await usersAPI.getProfile();
      const payload = extractResponseData(response);
      const userData = payload?.user || payload;
      
      if (userData) {
        dispatch({ type: ACTIONS.SET_USER, payload: userData });
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      // No lanzar el error para evitar que rompa la aplicación
      // Solo loguear y retornar null
      return null;
    }
  };

  const value = {
    // Estado
    ...state,
    
    // Acciones
    login,
    register,
    logout,
    loadGroups,
    loadSessions,
    loadNotifications,
    loadAchievements,
    loadUserData,
    updateUser,
    
    // Utilidades
    setLoading: (key, value) => dispatch({ type: ACTIONS.SET_LOADING, payload: { key, value } }),
    setError: (key, error) => dispatch({ type: ACTIONS.SET_ERROR, payload: { key, error } }),
    clearError: (key) => dispatch({ type: ACTIONS.CLEAR_ERROR, payload: key }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook personalizado
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de un AppProvider');
  }
  
  // Asegurarse de que el usuario tenga la propiedad isAdmin
  const userWithAdmin = context.user ? {
    ...context.user,
    isAdmin: context.user.role === 'admin' || context.user.is_admin || false
  } : null;
  
  return {
    ...context,
    state: {
      ...context.state,
      user: userWithAdmin
    },
    isAdmin: userWithAdmin?.isAdmin || false
  };
};

export default AppContext;