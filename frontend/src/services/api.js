import axios from 'axios';
import { buildError } from '@/utils/errorMessages';
import { getAuthToken, clearAuthToken, getRefreshToken } from '@/services/tokenManager';
import { setupTokenRefresh } from '@/utils/tokenRefreshInterceptor';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios para usar con interceptors
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Configurar renovación automática de tokens
setupTokenRefresh(axiosInstance);

// Exportar instancia de axios para uso directo (compatibilidad con código existente)
export const api = axiosInstance;

// Función helper para hacer requests usando axios
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = getAuthToken();
    
    // Detectar si es FormData para no establecer Content-Type
    const isFormData = options.data instanceof FormData;

    const config = {
      url: `${API_BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      headers: {
        // Solo establecer Content-Type si no es FormData y no se proporcionaron headers personalizados
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      data: options.data,
      params: options.params,
      withCredentials: true,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await axiosInstance(config);
    
    if (response.status >= 400) {
      const error = new Error(response.data?.message || 'Error en la solicitud');
      error.response = response;
      error.status = response.status;
      error.errors = response.data?.errors;
      throw error;
    }

    return response.data;
  } catch (error) {
    // Manejo de errores de red
    if (error.code === 'ERR_NETWORK') {
      throw buildError({
        status: 0,
        message:
          'No pudimos conectarnos con el servidor. Revisa tu conexión e inténtalo nuevamente.',
      });
    }
    
    // El manejo de 401 se hace en el interceptor de respuesta (tokenRefreshInterceptor)
    // No manejar 401 aquí para permitir que el interceptor intente renovar el token primero
    
    // Formatear error para que sea consistente
    if (error.response?.data) {
      throw buildError({
        status: error.response.status,
        ...error.response.data,
      });
    }
    
    throw buildError({
      status: error.response?.status || 500,
      message: error.message,
    });
  }
};

// Servicios de autenticación
export const authAPI = {
  login: (credentials) => 
    apiRequest('/auth/login', {
      method: 'POST',
      data: credentials,
    }),
  
  register: (userData) => 
    apiRequest('/auth/register', {
      method: 'POST',
      data: userData,
    }),
  
  logout: () => {
    const refreshToken = getRefreshToken();
    return apiRequest('/auth/logout', { 
      method: 'POST',
      data: { refreshToken }
    });
  },
  
  refreshToken: (refreshToken) => 
    apiRequest('/auth/refresh', {
      method: 'POST',
      data: { refreshToken },
    }),
  
  getMe: () => 
    apiRequest('/auth/me'),
  
  forgotPassword: (email) => 
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      data: { email },
    }),
};

// Servicios de usuarios
export const usersAPI = {
  getProfile: () => 
    apiRequest('/users/profile'),
  
  getUser: (userId) => 
    apiRequest(`/users/${userId}`),
  
  updateProfile: (profileData) => 
    apiRequest('/users/profile', {
      method: 'PUT',
      data: profileData,
    }),
};

// Servicios de grupos
export const groupsAPI = {
  getGroups: (params = {}) => {
    const timestamp = Date.now();
    return apiRequest(`/groups?_t=${timestamp}`, { params });
  },
  
  getGroup: (id) => 
    apiRequest(`/groups/${id}`),
  
  getGroupByInviteCode: (code) => 
    apiRequest(`/groups/by-invite-code/${code}`),
  
  createGroup: (groupData) => 
    apiRequest('/groups', {
      method: 'POST',
      data: groupData,
    }),
  
  updateGroup: (id, groupData) => 
    apiRequest(`/groups/${id}`, {
      method: 'PUT',
      data: groupData,
    }),
  
  deleteGroup: (id) => 
    apiRequest(`/groups/${id}`, { method: 'DELETE' }),
  
  joinGroup: (id, data = {}) => 
    apiRequest(`/groups/${id}/join`, { 
      method: 'POST',
      data 
    }),
  
  leaveGroup: (id) => 
    apiRequest(`/groups/${id}/leave`, { method: 'POST' }),
  
  searchGroups: (params = {}) => 
    apiRequest('/groups', { params: { ...params, public: true } }),
  
  getUserRoleInGroup: (groupId) => {
    if (!groupId) return Promise.resolve({ role: null });
    return apiRequest(`/groups/${groupId}/members/me`);
  },
  
  getGroupMembers: (groupId) => {
    if (!groupId) return Promise.resolve([]);
    return apiRequest(`/groups/${groupId}/members`);
  },
  
  getPendingMembers: (groupId) => 
    apiRequest(`/groups/${groupId}/pending-members`),
  
  approveMember: (groupId, memberId) => 
    apiRequest(`/groups/${groupId}/members/${memberId}/approve`, { method: 'POST' }),
  
  rejectMember: (groupId, memberId, data = {}) => 
    apiRequest(`/groups/${groupId}/members/${memberId}/reject`, { 
      method: 'POST',
      data 
    }),
};

// Servicios de sesiones
export const sessionsAPI = {
  getSessions: (params = {}) => 
    apiRequest('/sessions', { params }),
  
  getGroupSessions: (groupId, params = {}) => 
    apiRequest(`/groups/${groupId}/sessions`, { params }),
  
  getSession: (id) => 
    apiRequest(`/sessions/${id}`),
  
  createSession: (sessionData) => 
    apiRequest('/sessions', {
      method: 'POST',
      data: sessionData,
    }),
  
  updateSession: (id, sessionData) => 
    apiRequest(`/sessions/${id}`, {
      method: 'PUT',
      data: sessionData,
    }),
  
  deleteSession: (id) => 
    apiRequest(`/sessions/${id}`, { method: 'DELETE' }),
  
  joinSession: (id) => 
    apiRequest(`/sessions/${id}/join`, { method: 'POST' }),
  
  leaveSession: (id) => 
    apiRequest(`/sessions/${id}/leave`, { method: 'POST' }),
};

// Servicios de calendario
export const calendarAPI = {
  getEvents: (params = {}) => 
    apiRequest('/calendar/events', { params }),
  
  getEvent: (id) => 
    apiRequest(`/calendar/events/${id}`),
  
  createEvent: (eventData) => 
    apiRequest('/calendar/events', {
      method: 'POST',
      data: eventData,
    }),
  
  updateEvent: (id, eventData) => 
    apiRequest(`/calendar/events/${id}`, {
      method: 'PUT',
      data: eventData,
    }),
  
  deleteEvent: (id) => 
    apiRequest(`/calendar/events/${id}`, { method: 'DELETE' }),
  
  getMonthEvents: (year, month) => 
    apiRequest(`/calendar/month/${year}/${month}`),
};

// Servicios de logros
export const achievementsAPI = {
  getAchievements: (params = {}) => 
    apiRequest('/achievements', { params }),
  
  getUserAchievements: (params = {}) => 
    apiRequest('/achievements/user', { params }),
  
  getAchievement: (id) => 
    apiRequest(`/achievements/${id}`),
  
  unlockAchievement: (id) => 
    apiRequest(`/achievements/${id}/unlock`, { method: 'POST' }),
  
  getStats: () => 
    apiRequest('/achievements/stats'),
  
  checkAchievements: () => 
    apiRequest('/achievements/check', { method: 'POST' }),
};

// Servicios de notificaciones
export const notificationsAPI = {
  getNotifications: (params = {}) => 
    apiRequest('/notifications', { params }),
  
  getUnreadCount: () => 
    apiRequest('/notifications/unread-count'),
  
  getNotification: (id) => 
    apiRequest(`/notifications/${id}`),
  
  markAsRead: (id) => 
    apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  
  markAllAsRead: () => 
    apiRequest('/notifications/read-all', { method: 'PUT' }),
  
  deleteNotification: (id) => 
    apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
  
  clearAll: () => 
    apiRequest('/notifications/clear-all', { method: 'DELETE' }),
  
  getTypes: () => 
    apiRequest('/notifications/types'),
};

// Servicios de matching
export const matchingAPI = {
  getGroupRecommendations: (params = {}) => 
    apiRequest('/matching/groups', { params }),
  
  getUserRecommendations: (groupId, params = {}) => 
    apiRequest(`/matching/users/${groupId}`, { params }),
  
  getPreferences: () => 
    apiRequest('/matching/preferences'),
  
  updatePreferences: (preferencesData) => 
    apiRequest('/matching/preferences', {
      method: 'PUT',
      data: preferencesData,
    }),
};

// Servicios de recursos
export const resourcesAPI = {
  getResources: (params = {}) => 
    apiRequest('/resources', { params }),
  
  getResource: (id) => 
    apiRequest(`/resources/${id}`),
  
  uploadResource: (resourceData) => 
    apiRequest('/resources', { 
      method: 'POST', 
      data: resourceData 
    }),
  
  downloadResource: (id) => 
    apiRequest(`/resources/${id}/download`),
  
  deleteResource: (id) => 
    apiRequest(`/resources/${id}`, { method: 'DELETE' }),
};

// Servicios de sesiones de estudio individuales
export const forumsAPI = {
  // Obtener foros
  getForums: (params = {}) => apiRequest('/forums', { params }),
  
  // Obtener foro específico
  getForum: (id) => apiRequest(`/forums/${id}`),
  
  // Crear foro
  createForum: (data) => apiRequest('/forums', { method: 'POST', data }),
  
  // Actualizar foro
  updateForum: (id, data) => apiRequest(`/forums/${id}`, { method: 'PUT', data }),
  
  // Eliminar foro
  deleteForum: (id) => apiRequest(`/forums/${id}`, { method: 'DELETE' }),
  
  // Obtener posts de un foro
  getForumPosts: (forumId, params = {}) => apiRequest(`/forums/${forumId}/posts`, { params }),
  
  // Obtener post específico
  getPost: (postId) => apiRequest(`/forums/posts/${postId}`),
  
  // Crear post en foro
  createPost: (forumId, data) => apiRequest(`/forums/${forumId}/posts`, { method: 'POST', data }),
  
  // Crear respuesta a post
  createReply: (postId, data) => apiRequest(`/forums/posts/${postId}/replies`, { method: 'POST', data }),
  
  // Dar like a post
  likePost: (postId) => apiRequest(`/forums/posts/${postId}/like`, { method: 'POST' })
};


// Servicios de chat
export const chatAPI = {
  // Obtener mensajes de un grupo
  getMessages: (groupId, params = {}) => 
    apiRequest(`/groups/${groupId}/messages`, { params }),

  // Enviar mensaje a un grupo
  sendMessage: (groupId, content) => 
    apiRequest(`/groups/${groupId}/messages`, {
      method: 'POST',
      data: { content }
    }),

  // Marcar mensajes como leídos
  markAsRead: (groupId, messageIds) => 
    apiRequest(`/groups/${groupId}/messages/read`, {
      method: 'POST',
      data: { messageIds }
    }),

  // Obtener información de un grupo de chat
  getGroupInfo: (groupId) => 
    apiRequest(`/chat/groups/${groupId}`),

  // Crear un nuevo grupo de chat
  createGroup: (groupData) => 
    apiRequest('/chat/groups', {
      method: 'POST',
      data: groupData
    }),

  // Actualizar grupo de chat
  updateGroup: (groupId, groupData) => 
    apiRequest(`/chat/groups/${groupId}`, {
      method: 'PUT',
      data: groupData
    }),

  // Eliminar grupo de chat
  deleteGroup: (groupId) => 
    apiRequest(`/chat/groups/${groupId}`, {
      method: 'DELETE'
    }),

  // Añadir miembro a un grupo
  addMember: (groupId, userId) => 
    apiRequest(`/chat/groups/${groupId}/members`, {
      method: 'POST',
      data: { userId }
    }),

  // Eliminar miembro de un grupo
  removeMember: (groupId, userId) => 
    apiRequest(`/chat/groups/${groupId}/members/${userId}`, {
      method: 'DELETE'
    })
};

// Servicios de administración
export const adminAPI = {
  getDashboard: () => apiRequest('/admin/dashboard'),

  getUsers: (params = {}) =>
    apiRequest('/admin/users', { params }),

  updateUserStatus: (id, isActive) =>
    apiRequest(`/admin/users/${id}/status`, {
      method: 'PATCH',
      data: { is_active: isActive },
    }),

  getGroups: (params = {}) =>
    apiRequest('/admin/groups', { params }),

  updateGroupStatus: (id, status) =>
    apiRequest(`/admin/groups/${id}/status`, {
      method: 'PATCH',
      data: { status },
    }),

  getGroupMembers: (groupId) =>
    apiRequest(`/admin/groups/${groupId}/members`),

  getSessions: (params = {}) =>
    apiRequest('/admin/sessions', { params }),

  getNotifications: (params = {}) =>
    apiRequest('/notifications', { params }),

  // Recursos
  getResources: (params = {}) =>
    apiRequest('/admin/resources', { params }),

  deleteResource: (id) =>
    apiRequest(`/admin/resources/${id}`, { method: 'DELETE' }),

  getResourcesStats: () =>
    apiRequest('/admin/resources/stats'),

  // Foros
  getForums: (params = {}) =>
    apiRequest('/admin/forums', { params }),

  getForumPosts: (forumId, params = {}) =>
    apiRequest(`/admin/forums/${forumId}/posts`, { params }),

  deleteForum: (id) =>
    apiRequest(`/admin/forums/${id}`, { method: 'DELETE' }),

  deleteForumPost: (postId) =>
    apiRequest(`/admin/forums/posts/${postId}`, { method: 'DELETE' }),

  deleteForumReply: (replyId) =>
    apiRequest(`/admin/forums/replies/${replyId}`, { method: 'DELETE' }),

  getForumsStats: () =>
    apiRequest('/admin/forums/stats'),

  // Logs
  getLogs: (params = {}) =>
    apiRequest('/admin/logs', { params }),

  getLogsStats: () =>
    apiRequest('/admin/logs/stats'),
};

export default {
  auth: authAPI,
  users: usersAPI,
  groups: groupsAPI,
  sessions: sessionsAPI,
  calendar: calendarAPI,
  achievements: achievementsAPI,
  notifications: notificationsAPI,
  matching: matchingAPI,
  resources: resourcesAPI,
  admin: adminAPI,
};
