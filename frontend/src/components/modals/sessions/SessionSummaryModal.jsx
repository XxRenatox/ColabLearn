import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Users, Star, Award, FileText, MapPin, Video, Tag, GraduationCap, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../../ui/Avatar';
import { api } from '@/services/api';

const SessionSummaryModal = ({ isOpen, onClose, session }) => {
  const [userDataMap, setUserDataMap] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const userDataMapRef = useRef({});

  // Sincronizar ref con estado
  useEffect(() => {
    userDataMapRef.current = userDataMap;
  }, [userDataMap]);

  // Cargar datos de usuarios cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !session || typeof session !== 'object' || session === null) return;

    let isMounted = true;
    const loadingUsersSet = new Set(); // Para evitar cargar el mismo usuario múltiples veces

    // Función para buscar usuario por ID
    const fetchUserById = async (userId) => {
      if (!userId || loadingUsersSet.has(userId)) return;
      
      // Verificar si ya tenemos los datos usando el ref
      if (userDataMapRef.current[userId]) {
        return;
      }
      
      loadingUsersSet.add(userId);
      
      try {
        // Obtener datos públicos del usuario desde la API de usuarios
        const response = await api.get(`/users/${userId}`);
        if (response.data?.data?.user && isMounted) {
          setUserDataMap(prev => {
            // Verificar nuevamente antes de actualizar para evitar duplicados
            if (prev[userId]) return prev;
            return {
              ...prev,
              [userId]: response.data.data.user
            };
          });
        }
      } catch (error) {
        // Si falla, simplemente no cargar los datos adicionales
        // Los datos básicos ya vienen en la sesión (organizer, attendees)
        // Solo loguear en desarrollo para debugging
        if (isMounted && import.meta.env.DEV) {
          // Solo mostrar warning en desarrollo, no en producción
          console.debug(`No se pudieron obtener datos adicionales del usuario ${userId}. Usando datos de la sesión.`);
        }
      } finally {
        loadingUsersSet.delete(userId);
      }
    };

    const loadUserData = async () => {
      setLoadingUsers(true);
      const userIds = new Set();
      
      // Agregar organizador
      if (session.organizer_id) {
        userIds.add(session.organizer_id);
      }
      
      // Agregar participantes
      const attendees = Array.isArray(session?.attendees) ? session.attendees : 
                        Array.isArray(session?.session_attendance) ? session.session_attendance : [];
      
      attendees.forEach(attendee => {
        if (attendee?.user_id) {
          userIds.add(attendee.user_id);
        } else if (attendee?.id) {
          userIds.add(attendee.id);
        }
      });

      // Obtener usuarios que necesitamos buscar
      // La función fetchUserById ya verifica si el usuario ya está cargado
      const usersToFetch = Array.from(userIds);
      
      if (usersToFetch.length > 0 && isMounted) {
        try {
          // Hacer las peticiones en paralelo
          // Usar allSettled para que los errores individuales no detengan el proceso
          await Promise.allSettled(usersToFetch.map(id => fetchUserById(id)));
        } catch (err) {
          // Este catch solo se ejecutará si hay un error crítico
          // Los errores individuales ya se manejan en fetchUserById
          if (isMounted && import.meta.env.DEV) {
            console.debug('Error cargando datos de usuarios:', err);
          }
        }
      }
      
      if (isMounted) {
        setLoadingUsers(false);
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, session]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDuration = (minutes) => {
    const numMinutes = Number(minutes);
    if (isNaN(numMinutes) || numMinutes < 0) return '0min';
    const hours = Math.floor(numMinutes / 60);
    const mins = numMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getSessionTypeLabel = (type) => {
    const types = {
      'study': 'Estudio',
      'review': 'Repaso',
      'exam_prep': 'Prep. Examen',
      'project': 'Proyecto',
      'discussion': 'Discusión',
      'tutoring': 'Tutoría'
    };
    return types[type] || type;
  };

  // Validaciones y valores por defecto
  const attendees = Array.isArray(session?.attendees) ? session.attendees : 
                    Array.isArray(session?.session_attendance) ? session.session_attendance : [];
  
  // Calcular duración real
  let actualDuration = session?.duration || 0;
  if (session?.actual_start_time && session?.actual_end_time) {
    const start = new Date(session.actual_start_time);
    const end = new Date(session.actual_end_time);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      actualDuration = Math.round((end - start) / 60000); // Convertir a minutos
    }
  } else if (session?.actual_duration !== null && session?.actual_duration !== undefined) {
    actualDuration = session.actual_duration;
  }
  
  const actualStartTime = session?.actual_start_time || session?.scheduled_date;
  const actualEndTime = session?.actual_end_time || 
    (actualStartTime && !isNaN(new Date(actualStartTime).getTime()) 
      ? new Date(new Date(actualStartTime).getTime() + actualDuration * 60000).toISOString() 
      : null);

  // Validar fechas antes de formatear
  const safeFormatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return formatDate(dateString);
    } catch {
      return 'N/A';
    }
  };

  const safeFormatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return formatTime(dateString);
    } catch {
      return 'N/A';
    }
  };

  // Helper para obtener datos completos del usuario
  const getUserData = (userId) => {
    return userDataMap[userId] || null;
  };

  // Validación adicional para asegurar que session es un objeto válido
  // Esta validación debe estar DESPUÉS de todos los hooks
  if (!isOpen || !session || typeof session !== 'object' || session === null) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col mx-2 sm:mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 flex justify-between items-start sm:items-center">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                  {getSessionTypeLabel(session?.type || 'study')}
                </span>
                <span className="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                  Completada
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-semibold break-words">{session?.title || 'Sesión sin título'}</h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 truncate">{session?.group_name || 'Sin grupo'}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition flex-shrink-0 ml-2 sm:ml-4"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto">
            {loadingUsers && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Description */}
            {session?.description ? (
              <div className="mb-4 sm:mb-6">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{session.description}</p>
              </div>
            ) : (
              <div className="mb-4 sm:mb-6 text-center py-4">
                <p className="text-sm text-gray-500">No hay descripción disponible para esta sesión</p>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-xl sm:text-2xl font-bold text-blue-900">
                    {safeFormatDate(session?.scheduled_date || session?.actual_start_time) !== 'N/A' ? 
                      new Date(session?.scheduled_date || session?.actual_start_time).getDate() : 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">Fecha</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <span className="text-xl sm:text-2xl font-bold text-purple-900">{formatDuration(actualDuration)}</span>
                </div>
                <p className="text-xs text-purple-700 mt-1">Duración</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 sm:p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span className="text-xl sm:text-2xl font-bold text-green-900">
                    {Array.isArray(attendees) ? attendees.length : 0}
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">Participantes</p>
              </div>
              {(session?.average_rating !== null && session?.average_rating !== undefined) && (
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-2 sm:p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 fill-current" />
                    <span className="text-xl sm:text-2xl font-bold text-yellow-900">{session.average_rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">Calificación</p>
                </div>
              )}
            </div>

            {/* Group Information */}
            {session?.groups && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">DETALLES DEL GRUPO</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="flex items-start">
                    <div 
                      className={`w-5 h-5 rounded-full mr-2 flex-shrink-0 mt-0.5 ${session.groups.color || 'bg-teal-500'}`}
                    />
                    <div>
                      <p className="text-xs text-gray-500">Grupo</p>
                      <p className="text-sm font-medium text-gray-900">
                        {session.groups.name || session?.group_name}
                      </p>
                    </div>
                  </div>
                  {session.groups.subject && (
                    <div className="flex items-start">
                      <Book className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Materia</p>
                        <p className="text-sm font-medium text-gray-900">{session.groups.subject}</p>
                      </div>
                    </div>
                  )}
                  {session.groups.career && (
                    <div className="flex items-start">
                      <GraduationCap className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Carrera</p>
                        <p className="text-sm font-medium text-gray-900">{session.groups.career}</p>
                      </div>
                    </div>
                  )}
                  {session.groups.university && (
                    <div className="flex items-start">
                      <GraduationCap className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Universidad</p>
                        <p className="text-sm font-medium text-gray-900">{session.groups.university}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location and Time */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">INFORMACIÓN DE LA SESIÓN</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="flex items-start">
                  {(session?.location_type === 'virtual' || session?.location_type === 'online' || 
                    (session?.location_details && (session.location_details.toLowerCase().includes('meet') || 
                     session.location_details.toLowerCase().includes('zoom') || 
                     session.location_details.toLowerCase().includes('teams')))) ? (
                    <Video className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <MapPin className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Ubicación</p>
                    <p className="text-sm font-medium text-gray-900">
                      {session?.location_type === 'virtual' || session?.location_type === 'online' ? 'Virtual' : 'Presencial'}
                      {session?.platform && ` • ${session.platform}`}
                      {session?.location_room && ` • ${session.location_room}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Horario</p>
                    <p className="text-sm font-medium text-gray-900">
                      {safeFormatTime(actualStartTime)} - {safeFormatTime(actualEndTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Earned */}
            {session?.xp_earned !== null && session?.xp_earned !== undefined && session.xp_earned > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900">XP Ganado</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600">{session.xp_earned} puntos</p>
                  </div>
                </div>
              </div>
            )}

            {/* Organizer */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">ORGANIZADOR</h3>
              {(() => {
                const organizerId = session?.organizer_id || session?.organizer?.id;
                const organizerData = organizerId ? getUserData(organizerId) : null;
                const organizerName = organizerData?.name || session?.organizer_name || session?.organizer?.name || 'Organizador';
                const organizerAvatar = organizerData?.avatar || session?.organizer?.avatar || session?.organizer_avatar;
                const organizerUniversity = organizerData?.university || session?.organizer?.university;
                const organizerCareer = organizerData?.career || session?.organizer?.career;
                
                return (
                  <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white border border-gray-100 rounded-lg">
                    <Avatar
                      userId={String(organizerId || 'organizer')}
                      name={organizerName}
                      avatar={organizerData?.avatar_url || session?.organizer?.avatar_url || null}
                      avatarStyle={organizerAvatar}
                      size="md"
                      showBorder={true}
                      className="shadow border-2 border-white flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{organizerName}</p>
                      {organizerUniversity && (
                        <p className="text-xs text-gray-500 truncate">{organizerUniversity}</p>
                      )}
                      {organizerCareer && (
                        <p className="text-xs text-gray-500 truncate">{organizerCareer}</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Agenda/Topics */}
            {session?.agenda && Array.isArray(session.agenda) && session.agenda.length > 0 ? (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">AGENDA DE LA SESIÓN</h3>
                <div className="space-y-2">
                  {session.agenda.filter(item => item != null).map((item, index) => {
                    let itemText = '';
                    let itemDuration = null;
                    
                    if (typeof item === 'string') {
                      itemText = item;
                    } else if (item && typeof item === 'object') {
                      itemText = item.topic || item.title || String(item);
                      itemDuration = item.duration;
                    } else {
                      itemText = String(item || '');
                    }
                    
                    if (!itemText || !itemText.trim()) return null;
                    
                    return (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition gap-2"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 break-words">{itemText}</span>
                        </div>
                        {itemDuration !== null && itemDuration !== undefined && (
                          <span className="text-xs sm:text-sm text-gray-500 font-medium sm:ml-2">
                            {formatDuration(itemDuration)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">AGENDA DE LA SESIÓN</h3>
                <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center">
                  <p className="text-sm text-gray-500">No hay agenda disponible para esta sesión</p>
                </div>
              </div>
            )}

            {/* Session Notes */}
            {session?.session_notes ? (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">NOTAS DE LA SESIÓN</h3>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  {typeof session.session_notes === 'string' ? (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{session.session_notes}</p>
                  ) : session.session_notes?.summary ? (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{session.session_notes.summary}</p>
                  ) : (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(session.session_notes, null, 2)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">NOTAS DE LA SESIÓN</h3>
                <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center">
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay notas disponibles para esta sesión</p>
                </div>
              </div>
            )}

            {/* Participants */}
            {Array.isArray(attendees) && attendees.length > 0 ? (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center justify-between">
                  <span>PARTICIPANTES</span>
                  <span className="text-xs sm:text-sm font-normal text-gray-500">({attendees.length})</span>
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {attendees.filter(attendee => attendee != null).map((attendee, index) => {
                    const attendeeUserId = attendee?.user_id || attendee?.id;
                    const attendeeData = attendeeUserId ? getUserData(attendeeUserId) : null;
                    const attendeeId = String(attendeeUserId || attendee?.email || `user-${index}`);
                    const attendeeName = attendeeData?.name || attendee?.name || attendee?.username || 'Usuario';
                    const attendeeAvatar = attendeeData?.avatar || attendee?.avatar;
                    const attendeeUniversity = attendeeData?.university || attendee?.university;
                    const attendeeCareer = attendeeData?.career || attendee?.career;
                    
                    const getStatusLabel = (status) => {
                      const statusMap = {
                        'attended': 'Asistió',
                        'joined': 'Se unió',
                        'declined': 'Rechazó',
                        'pending': 'Pendiente',
                        'confirmed': 'Confirmado'
                      };
                      return statusMap[status] || status || 'Confirmado';
                    };

                    const getStatusColor = (status) => {
                      const colorMap = {
                        'attended': 'bg-green-100 text-green-800',
                        'joined': 'bg-blue-100 text-blue-800',
                        'declined': 'bg-red-100 text-red-800',
                        'pending': 'bg-yellow-100 text-yellow-800',
                        'confirmed': 'bg-gray-100 text-gray-800'
                      };
                      return colorMap[status] || 'bg-gray-100 text-gray-800';
                    };
                    
                    return (
                      <div
                        key={attendeeId}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition gap-2"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <Avatar
                            userId={attendeeId}
                            name={attendeeName}
                            avatar={attendeeData?.avatar_url || attendee?.avatar_url || null}
                            avatarStyle={attendeeAvatar}
                            size="md"
                            showBorder={true}
                            className="mr-2 sm:mr-3 shadow border-2 border-white flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attendeeName}
                              </p>
                              {attendee?.status && (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatusColor(attendee.status)}`}>
                                  {getStatusLabel(attendee.status)}
                                </span>
                              )}
                            </div>
                            {attendeeUniversity && (
                              <p className="text-xs text-gray-500 truncate">{attendeeUniversity}</p>
                            )}
                            {attendeeCareer && (
                              <p className="text-xs text-gray-500 truncate">{attendeeCareer}</p>
                            )}
                            {(attendee?.joined_at || attendee?.left_at || attendee?.actual_duration !== null) && (
                              <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-gray-500">
                                {attendee?.joined_at && (
                                  <span>Unió: {safeFormatTime(attendee.joined_at)}</span>
                                )}
                                {attendee?.actual_duration !== null && attendee?.actual_duration !== undefined && (
                                  <span>• {formatDuration(attendee.actual_duration)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">PARTICIPANTES</h3>
                <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay participantes registrados</p>
                </div>
              </div>
            )}

            {/* Resources */}
            {session?.resources && Array.isArray(session.resources) && session.resources.length > 0 ? (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">RECURSOS COMPARTIDOS</h3>
                <div className="space-y-2">
                  {session.resources.filter(resource => resource != null).map((resource, index) => {
                    let resourceText = '';
                    let resourceUrl = null;
                    let resourceType = null;
                    
                    if (typeof resource === 'string') {
                      resourceText = resource;
                      resourceUrl = resource.startsWith('http') ? resource : null;
                    } else if (resource && typeof resource === 'object') {
                      resourceUrl = resource.url || resource.value || resource.link || null;
                      resourceType = resource.type || null;
                      // Si es un link, usar el URL como texto si no hay nombre/título
                      if (resourceType === 'link' && resourceUrl) {
                        resourceText = resource.name || resource.title || resourceUrl;
                      } else {
                        resourceText = resource.name || resource.title || resource.value || String(resource);
                      }
                    } else {
                      resourceText = String(resource || '');
                    }
                    
                    if (!resourceText || !resourceText.trim()) return null;
                    
                    const isLink = resourceType === 'link' || (resourceUrl && resourceUrl.startsWith('http'));
                    
                    return (
                      <div
                        key={resource?.id || index}
                        className="flex items-center space-x-2 p-2 sm:p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition"
                      >
                        {isLink ? (
                          <a
                            href={resourceUrl || resourceText}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 flex-1 min-w-0 text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium flex-1 truncate">
                              {resourceText}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0">↗</span>
                          </a>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600 flex-1 truncate">
                              {resourceText}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">RECURSOS COMPARTIDOS</h3>
                <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center">
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay recursos compartidos</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 p-3 sm:p-4 flex justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white transition"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SessionSummaryModal;

