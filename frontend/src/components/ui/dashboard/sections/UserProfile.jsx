import React from 'react';
import {
  Award,
  Star,
  Users,
  Calendar,
  BookOpen,
  Clock,
  MapPin,
  Mail,
  Trophy,
  Target,
  Compass,
  Sun,
  Moon,
  Layers,
  Activity,
  Shield,
  User,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { usersAPI } from '../../../../services/api';
import { getTokenInfo } from '../../../../services/tokenManager';
import Avatar from '../../../ui/Avatar';
import ChangeAvatarModal from '../../../modals/profile/ChangeAvatarModal';
import { Settings } from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import { SectionCard } from '../../../ui/cards/common/SectionCard';
import { StatSummaryCard } from '../../../ui/cards/landing/StatSummaryCard';

const renderChips = (items = [], emptyLabel = 'Sin definir') => {
  if (!items || items.length === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500">
        {emptyLabel}
      </span>
    );
  }

  return items.map((item) => (
    <span key={item} className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
      {item}
    </span>
  ));
};

import SecuritySettings from './SecuritySettings';
import ProfileEditSettings from './ProfileEditSettings';

const formatStudyStyle = (style) => {
  switch (style) {
    case 'focused':
      return 'Sesiones intensivas';
    case 'collaborative':
      return 'Colaborativo';
    case 'mixed':
      return 'Mixto';
    case 'any':
      return 'Sin preferencia';
    default:
      return style || 'Sin preferencia';
  }
};

const formatGroupSize = (size) => {
  switch (size) {
    case 'solo':
      return 'Trabajo individual';
    case 'small':
      return 'Grupos pequeños (2-3)';
    case 'medium':
      return 'Grupos medianos (4-6)';
    case 'large':
      return 'Grupos grandes (7+)';
    case 'any':
      return 'Sin preferencia';
    default:
      return size || 'Sin preferencia';
  }
};

export default function UserProfile({ user, userAchievements = [], achievements = [], loading, groups = [], sessions = [] }) {
  const { user: contextUser, updateUser } = useApp();
  // Usar el usuario del contexto si está disponible, sino usar el prop
  const effectiveUser = contextUser || user;
  const [fullUser, setFullUser] = React.useState(effectiveUser);
  const [loadingProfile, setLoadingProfile] = React.useState(false);
  const [showAvatarModal, setShowAvatarModal] = React.useState(false);
  const navigate = useNavigate();

  // Sincronizar con el usuario del contexto cuando cambie
  React.useEffect(() => {
    if (contextUser) {
      setFullUser(contextUser);
    } else if (user) {
      setFullUser(user);
    }
  }, [contextUser, user]);

  // Cargar perfil completo si no tiene created_at
  React.useEffect(() => {
    const userToLoad = effectiveUser;
    if (userToLoad && !userToLoad.created_at) {
      setLoadingProfile(true);
      usersAPI.getProfile()
        .then((response) => {
          const profileData = response?.data?.user || response?.user || response;
          if (profileData && profileData.created_at) {
            const updatedUser = { ...userToLoad, ...profileData };
            setFullUser(updatedUser);
            // Actualizar también en el contexto
            if (updateUser) {
              updateUser();
            }
          }
        })
        .catch((error) => {
          console.warn('Error cargando perfil completo:', error);
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    }
  }, [effectiveUser?.id]); // Solo cuando cambia el ID del usuario

  // Calcular última actividad real del usuario
  const lastActivity = React.useMemo(() => {
    const activityDates = [];

    // 1. Última sesión completada o asistida
    if (sessions && Array.isArray(sessions) && sessions.length > 0) {
      sessions.forEach(session => {
        if (session.status === 'completed' && session.scheduled_date) {
          const date = new Date(session.scheduled_date);
          if (!isNaN(date.getTime())) {
            activityDates.push(date);
          }
        }
        if ((session.status === 'in_progress' || session.status === 'scheduled') && session.scheduled_date) {
          const date = new Date(session.scheduled_date);
          if (!isNaN(date.getTime())) {
            activityDates.push(date);
          }
        }
      });
    }

    // 2. Última vez que se unió a un grupo
    if (groups && Array.isArray(groups) && groups.length > 0) {
      groups.forEach(group => {
        if (group.joinedAt) {
          const date = new Date(group.joinedAt);
          if (!isNaN(date.getTime())) {
            activityDates.push(date);
          }
        }
        if (group.last_activity) {
          const date = new Date(group.last_activity);
          if (!isNaN(date.getTime())) {
            activityDates.push(date);
          }
        }
      });
    }

    // 3. Usar last_active del usuario si está disponible
    if (fullUser?.last_active) {
      const date = new Date(fullUser.last_active);
      if (!isNaN(date.getTime())) {
        activityDates.push(date);
      }
    }

    // Obtener la fecha más reciente
    if (activityDates.length > 0) {
      return new Date(Math.max(...activityDates.map(d => d.getTime())));
    }

    return null;
  }, [sessions, groups, fullUser?.last_active]);

  // Formatear fecha de última actividad
  const formatLastActivity = () => {
    if (lastActivity) {
      const now = new Date();
      const diffMs = now - lastActivity;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return `Hoy a las ${lastActivity.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays === 1) {
        return `Ayer a las ${lastActivity.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays < 7) {
        const dateStr = lastActivity.toLocaleDateString('es-ES', { weekday: 'long' });
        const timeStr = lastActivity.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} a las ${timeStr}`;
      } else if (diffDays < 30) {
        const dateStr = lastActivity.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        const timeStr = lastActivity.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} a las ${timeStr}`;
      } else {
        return lastActivity.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
    return 'Sin actividad registrada';
  };

  // Determinar estado de sesión (en línea/desconectado)
  const getSessionStatus = () => {
    if (!fullUser?.last_active) {
      return { label: 'Desconectado', tone: 'text-gray-400', icon: '🔴' };
    }

    const lastActive = new Date(fullUser.last_active);
    const now = new Date();
    const diffMs = now - lastActive;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Si la última actividad fue hace menos de 15 minutos, está en línea
    if (diffMinutes < 15) {
      return { label: 'En línea', tone: 'text-emerald-400', icon: '🟢' };
    } else if (diffMinutes < 60) {
      return { label: `Activo hace ${diffMinutes} min`, tone: 'text-amber-400', icon: '🟡' };
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) {
        return { label: `Activo hace ${diffHours}h`, tone: 'text-orange-400', icon: '🟠' };
      } else {
        return { label: 'Desconectado', tone: 'text-gray-400', icon: '🔴' };
      }
    }
  };

  // Formatear fecha de registro
  const formatRegistrationDate = () => {
    const registrationDate = fullUser?.created_at;
    if (!registrationDate) {
      return 'Fecha no disponible';
    }
    try {
      const date = new Date(registrationDate);
      if (isNaN(date.getTime())) {
        return 'Fecha no disponible';
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  // Formatear último login
  const formatLastLogin = () => {
    const lastActive = fullUser?.last_active;
    if (!lastActive) {
      return 'Nunca';
    }
    try {
      const date = new Date(lastActive);
      if (isNaN(date.getTime())) {
        return 'Nunca';
      }
      const now = new Date();
      const diffMs = now - date;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        return 'Hace unos momentos';
      } else if (diffMinutes < 60) {
        return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      } else if (diffDays === 1) {
        return `Ayer a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays < 7) {
        return date.toLocaleDateString('es-ES', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return 'Nunca';
    }
  };

  // Calcular expiración del token
  const getTokenExpiration = () => {
    const tokenInfo = getTokenInfo();
    const lastActive = fullUser?.last_active;

    if (!lastActive) {
      return null;
    }

    try {
      const loginDate = new Date(lastActive);
      if (isNaN(loginDate.getTime())) {
        return null;
      }

      const expirationDate = new Date(loginDate);
      expirationDate.setDate(expirationDate.getDate() + tokenInfo.durationDays);

      const now = new Date();
      const diffMs = expirationDate - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (diffMs < 0) {
        return 'Expirado';
      } else if (diffDays > 0) {
        return `Expira en ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `Expira en ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      } else {
        return 'Expira pronto';
      }
    } catch (error) {
      return null;
    }
  };

  const stats = {
    totalSessions: sessions.length,
    completedSessions: sessions.filter((session) => session.status === 'completed').length,
    totalGroups: groups.length,
    totalAchievements: userAchievements.filter((ua) => ua.unlocked_at).length,
    studyHours: fullUser?.study_hours || 0,
    currentStreak: fullUser?.streak || 0,
    level: fullUser?.level || 1,
    xp: fullUser?.xp || 0,
  };

  const preferences = fullUser?.preferences || {};
  const studyPreferences = preferences.study_preferences || {};
  const preferredTimes = studyPreferences.preferred_times || [];
  const preferredStyle = studyPreferences.study_style || studyPreferences.mode || '';
  const groupSize = studyPreferences.group_size || '';

  // Procesar logros completados del usuario
  const processedAchievements = React.useMemo(() => {
    // Validar que userAchievements sea un array válido
    if (!userAchievements || !Array.isArray(userAchievements) || userAchievements.length === 0) {
      return [];
    }

    // Filtrar solo logros desbloqueados (con unlocked_at) y que tengan datos del logro
    const unlocked = userAchievements.filter((ua) => {
      // Verificar que tiene unlocked_at (está desbloqueado)
      const hasUnlocked = ua.unlocked_at !== null && ua.unlocked_at !== undefined;

      // Verificar que tiene datos del logro (puede venir como objeto anidado 'achievements' o directo)
      const hasAchievementData = (ua.achievements && typeof ua.achievements === 'object') ||
        (ua.id && ua.name);

      return hasUnlocked && hasAchievementData;
    });

    // Mapear a formato esperado por el componente Achievements
    const processed = unlocked.map((ua) => {
      // Obtener datos del logro (puede venir como objeto anidado o directo)
      const achievementData = (ua.achievements && typeof ua.achievements === 'object')
        ? ua.achievements
        : ua;

      return {
        id: achievementData.id || ua.achievement_id,
        name: achievementData.name,
        description: achievementData.description,
        icon: achievementData.icon,
        category: achievementData.category,
        rarity: achievementData.rarity || 'common',
        xp_reward: achievementData.xp_reward || 0,
        requirements: achievementData.requirements,
        unlocked: true,
        unlockedAt: ua.unlocked_at,
        progress: ua.progress || {},
      };
    }).filter((achievement) => achievement && achievement.id && achievement.name); // Filtrar logros válidos

    return processed;
  }, [userAchievements]);

  // is_active tiene valor por defecto TRUE en la BD, solo mostrar "desactivada" si es explícitamente false
  const statusChip = fullUser?.is_active === false
    ? { label: 'Cuenta desactivada', tone: 'bg-rose-100 text-rose-700 border-rose-200' }
    : { label: 'Usuario activo', tone: 'bg-emerald-100 text-emerald-700 border-emerald-200' };

  const getRarityBg = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      case 'common':
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-emerald-900 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative group">
              <Avatar
                userId={fullUser?.id || fullUser?.email || 'user'}
                name={fullUser?.name || fullUser?.first_name + ' ' + fullUser?.last_name || 'Usuario'}
                avatar={fullUser?.avatar_url || null}
                avatarStyle={fullUser?.avatar}
                size={64}
                showBorder={false}
                className="shadow-lg shadow-emerald-500/30 cursor-pointer"
              />
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                aria-label="Cambiar avatar"
              >
                <Settings className="w-6 h-6 text-white" />
              </button>
              <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 text-xs font-medium ${statusChip.tone}`}>
                {statusChip.label}
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{fullUser?.name || 'Estudiante'}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-100">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  <Mail className="h-4 w-4" />
                  {fullUser?.email}
                </span>
                {fullUser?.university && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <MapPin className="h-4 w-4" />
                    {fullUser.university}
                  </span>
                )}
                {(fullUser?.career || fullUser?.semester) && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <Layers className="h-4 w-4" />
                    {fullUser?.career}
                    {fullUser?.semester && <span className="opacity-80">• Semestre {fullUser.semester}</span>}
                  </span>
                )}
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-slate-200 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>Nivel {stats.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-300" />
                  <span>Última actividad: {formatLastActivity()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-sky-300" />
                  <span>{stats.xp} XP acumulados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-300" />
                  <span>Miembro desde {formatRegistrationDate()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <SectionCard title="Resumen de actividad" icon={Clock} accent="bg-amber-100 text-amber-600">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: 'Sesiones completadas',
                  value: `${stats.completedSessions}`,
                  subtitle: `de ${stats.totalSessions}`,
                  tone: 'from-cyan-500 to-sky-500',
                },
                {
                  title: 'Grupos activos',
                  value: stats.totalGroups,
                  subtitle: 'en los que participas',
                  tone: 'from-purple-500 to-indigo-500',
                },
                {
                  title: 'Horas estudiadas',
                  value: `${stats.studyHours.toFixed(1)}h`,
                  subtitle: 'registradas en total',
                  tone: 'from-emerald-500 to-teal-500',
                },
                {
                  title: 'Logros obtenidos',
                  value: stats.totalAchievements,
                  subtitle: 'recompensas desbloqueadas',
                  tone: 'from-amber-500 to-orange-500',
                },
              ].map((item) => (
                <StatSummaryCard
                  key={item.title}
                  title={item.title}
                  value={item.value}
                  subtitle={item.subtitle}
                  tone={item.tone}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Preferencias de estudio"
            icon={Compass}
            accent="bg-emerald-100 text-emerald-600"
            description="Usamos tus preferencias para recomendarte grupos, sesiones y compañeros compatibles."
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Materias favoritas</p>
                <div className="flex flex-wrap gap-2">{renderChips(preferences.subjects, 'Agrega materias de interés')}</div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Intereses</p>
                <div className="flex flex-wrap gap-2">{renderChips(preferences.interests, 'Añade intereses para mejores matches')}</div>
              </div>
              <div className="space-y-3 rounded-2xl border border-dashed border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Horario preferido</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                  {preferredTimes.length > 0 ? (
                    preferredTimes.map((time) => (
                      <span key={time} className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-1 text-purple-600">
                        {time.toLowerCase().includes('noche') ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        {time}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1 text-gray-500">
                      <Clock className="h-4 w-4" />
                      Sin preferencia
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-3 rounded-2xl border border-dashed border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Modalidad ideal</p>
                <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1 text-orange-600">
                    <Target className="h-4 w-4" />
                    {formatStudyStyle(preferredStyle)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-1 text-sky-600">
                    <Users className="h-4 w-4" />
                    {formatGroupSize(groupSize)}
                  </span>
                </div>
              </div>
              {preferences.goals && (
                <div className="lg:col-span-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Objetivos personales</p>
                  <p className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-sm text-gray-700">{preferences.goals}</p>
                </div>
              )}
            </div>
          </SectionCard>

          {stats.currentStreak > 0 && (
            <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-rose-50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                    <Award className="h-6 w-6 text-orange-500" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">¡Racha activa!</h3>
                    <p className="text-sm text-gray-600">
                      Llevas {stats.currentStreak} día{stats.currentStreak !== 1 ? 's' : ''} consecutivo{stats.currentStreak !== 1 ? 's' : ''} estudiando.
                    </p>
                  </div>
                </div>
                <div className="rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-orange-600">Mantén el ritmo 🔥</div>
              </div>
            </div>
          )}

          <SectionCard title="Logros destacados" icon={Trophy} accent="bg-yellow-50 text-yellow-600 ">
            <div className="space-y-4">
              {processedAchievements.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    {processedAchievements.slice(0, 3).map((achievement) => {
                      const bgGradient = getRarityBg(achievement.rarity);

                      return (
                        <div key={achievement.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white/50 hover:bg-white transition-colors">
                          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${bgGradient} text-white shadow-sm`}>
                            <Trophy className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                            <p className="truncate text-sm text-gray-500">{achievement.description}</p>
                            <p className="mt-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                              {achievement.rarity === 'legendary' ? 'Legendario' :
                                achievement.rarity === 'epic' ? 'Épico' :
                                  achievement.rarity === 'rare' ? 'Raro' : 'Común'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => navigate('/achievements')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-3 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-all"
                  >
                    Ver todos los logros
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 p-8 text-center bg-gray-50/50">
                  <Trophy className="h-12 w-12 text-gray-300" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Aún no tienes logros</h4>
                    <p className="text-sm text-gray-500">Participa en sesiones y grupos para desbloquear tu primer hito.</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Resumen rápido" icon={Layers} accent="bg-slate-100 text-slate-700">
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <BookOpen className="h-4 w-4" /> Sesiones activas
                </span>
                <span className="font-medium text-gray-900">{stats.totalSessions}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <Users className="h-4 w-4" /> Grupos actuales
                </span>
                <span className="font-medium text-gray-900">{stats.totalGroups}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <Trophy className="h-4 w-4" /> Logros obtenidos
                </span>
                <span className="font-medium text-gray-900">{stats.totalAchievements}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <Clock className="h-4 w-4" /> Horas registradas
                </span>
                <span className="font-medium text-gray-900">{stats.studyHours.toFixed(1)} h</span>
              </li>
            </ul>
          </SectionCard>



          <SectionCard title="Plan de crecimiento" icon={Target} accent="bg-indigo-100 text-indigo-600">
            <div className="space-y-4 text-sm text-gray-600">
              <div className="rounded-2xl bg-indigo-50/70 p-4">
                <p className="font-medium text-indigo-700">Próximo nivel</p>
                <p className="mt-1 text-indigo-600">
                  Te faltan <strong>{1000 - (stats.xp % 1000)} XP</strong> para alcanzar el nivel {stats.level + 1}.
                </p>
              </div>
              <div className="rounded-2xl bg-purple-50/70 p-4">
                <p className="font-medium text-purple-700">Sugerencia personalizada</p>
                <p className="mt-1 text-purple-600">Completa 3 sesiones colaborativas esta semana para maximizar tus recompensas.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Información del Perfil" icon={User} accent="bg-blue-50 text-blue-600">
            <ProfileEditSettings />
          </SectionCard>

          <SectionCard title="Seguridad de la Cuenta" icon={Shield} accent="bg-red-50 text-red-600">
            <SecuritySettings />
          </SectionCard>
        </div>
      </div>

      {/* Modal de cambio de avatar */}
      <ChangeAvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        user={fullUser}
        onAvatarChanged={(updatedUser) => {
          setFullUser(updatedUser);
        }}
      />
    </div>
  );
}
