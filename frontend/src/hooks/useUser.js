import { useApp } from '../contexts/AppContext';

// Hook personalizado para acceder a los datos del usuario
export const useUser = () => {
  const { user, isAuthenticated, login, logout } = useApp();

  // Función para obtener el nombre completo del usuario
  const getFullName = () => {
    if (!user) return 'Usuario';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    
    return user.name || user.username || 'Usuario';
  };

  // Función para obtener las iniciales del usuario
  const getInitials = () => {
    if (!user) return 'U';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    
    const name = user.name || user.username || 'Usuario';
    return name.charAt(0).toUpperCase();
  };

  // Función para obtener información académica
  const getAcademicInfo = () => {
    if (!user) return null;
    
    const info = [];
    if (user.career) info.push(user.career);
    if (user.university) info.push(user.university);
    if (user.semester) info.push(`${user.semester}° semestre`);
    
    return info.length > 0 ? info.join(' - ') : null;
  };

  // Función para obtener el avatar del usuario
  const getAvatarUrl = () => {
    return user?.avatar_url || user?.profile_picture || null;
  };

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return user?.role === role || user?.roles?.includes(role);
  };

  // Función para obtener estadísticas básicas del usuario
  const getStats = () => {
    if (!user) return null;
    
    return {
      level: user.level || 1,
      xp: user.xp || 0,
      studyHours: user.study_hours || 0,
      groupsCount: user.groups_count || 0,
      achievementsCount: user.achievements_count || 0,
    };
  };

  return {
    // Datos básicos
    user,
    isAuthenticated,
    
    // Funciones de autenticación
    login,
    logout,
    
    // Funciones de utilidad
    getFullName,
    getInitials,
    getAcademicInfo,
    getAvatarUrl,
    hasRole,
    getStats,
    
    // Propiedades computadas
    fullName: getFullName(),
    initials: getInitials(),
    academicInfo: getAcademicInfo(),
    avatarUrl: getAvatarUrl(),
    stats: getStats(),
  };
};

export default useUser;
