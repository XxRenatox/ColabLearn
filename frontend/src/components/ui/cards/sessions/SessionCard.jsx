import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, MapPin, Edit, Trash2, Star, Share2, CalendarPlus, Sparkles } from 'lucide-react';
import Avatar from '../../Avatar';
import { useToast } from '../../Toast';
import ConfirmModal from '../../../modals/ConfirmModal';

const formatSessionDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatSessionTime = (dateString) => {
  if (!dateString) return '';
  // La fecha viene del servidor en formato UTC pero representa la hora local del usuario
  // Extraemos la hora directamente del string ISO sin conversión de zona horaria
  const match = dateString.match(/T(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  // Fallback si el formato no coincide
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
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

const getStatusLabel = (status) => {
  const statuses = {
    'scheduled': 'Programada',
    'in_progress': 'En Progreso',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
    'postponed': 'Pospuesta'
  };
  return statuses[status] || status;
};

const getStatusColor = (status) => {
  const colors = {
    'scheduled': 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-green-100 text-green-800',
    'completed': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800',
    'postponed': 'bg-yellow-100 text-yellow-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const SessionCard = ({ session, type = 'upcoming', onJoinSession, sessionActionLoading, onViewSummary, isNextSession = false, onEditSession, onDeleteSession, user }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { addToast } = useToast();
  const [timeUntil, setTimeUntil] = useState('');
  const [canJoin, setCanJoin] = useState(false);

  // Verificar si se puede unir a la sesión (90 minutos antes de que comience)
  useEffect(() => {
    if (type === 'upcoming' && session.scheduled_date) {
      const checkCanJoin = () => {
        const now = new Date();
        const scheduledDate = new Date(session.scheduled_date);
        const joinWindowStart = new Date(scheduledDate);
        joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 90); // 90 minutos antes

        // Se puede unir si ya pasó la ventana de unión (90 min antes) y la sesión no ha terminado
        const sessionEndTime = new Date(scheduledDate);
        sessionEndTime.setMinutes(sessionEndTime.getMinutes() + (session.duration || 120) + 60);
        
        setCanJoin(now >= joinWindowStart && now <= sessionEndTime && session.status === 'scheduled');
      };

      checkCanJoin();
      const interval = setInterval(checkCanJoin, 60000); // Verificar cada minuto

      return () => clearInterval(interval);
    }
  }, [type, session.scheduled_date, session.duration, session.status]);

  // Contador regresivo para próximas sesiones
  useEffect(() => {
    if (type === 'upcoming' && session.scheduled_date) {
      const updateTimeUntil = () => {
        const now = new Date();
        const scheduledDate = new Date(session.scheduled_date);
        const diff = scheduledDate - now;

        if (diff <= 0) {
          setTimeUntil('¡Ya comenzó!');
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeUntil(`en ${days} día${days > 1 ? 's' : ''} ${hours}h`);
        } else if (hours > 0) {
          setTimeUntil(`en ${hours}h ${minutes}min`);
        } else {
          setTimeUntil(`en ${minutes}min`);
        }
      };

      updateTimeUntil();
      const interval = setInterval(updateTimeUntil, 60000); // Actualizar cada minuto

      return () => clearInterval(interval);
    }
  }, [type, session.scheduled_date]);

  // Agregar a calendario
  const handleAddToCalendar = () => {
    try {
      const startDate = new Date(session.scheduled_date);
      const endDate = new Date(startDate.getTime() + (session.duration || 60) * 60000);
      
      const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const title = encodeURIComponent(session.title);
      const description = encodeURIComponent(session.description || '');
      const location = encodeURIComponent(
        session.location_type === 'virtual' 
          ? (session.platform || 'Virtual')
          : (session.location_details || '')
      );
      const start = formatDate(startDate);
      const end = formatDate(endDate);

      // Google Calendar
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}&location=${location}`;
      
      // Intentar abrir Google Calendar
      window.open(googleUrl, '_blank');
      addToast('Calendario abierto. Puedes agregar la sesión a tu calendario.', 'success');
    } catch (error) {
      addToast('Error al abrir el calendario', 'error');
    }
  };

  // Compartir sesión
  const handleShare = async () => {
    try {
      const sessionUrl = `${window.location.origin}/sessions/${session.id}`;
      const shareData = {
        title: session.title,
        text: `Te invito a la sesión: ${session.title}`,
        url: sessionUrl
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        addToast('Sesión compartida exitosamente', 'success');
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(sessionUrl);
        addToast('Enlace copiado al portapapeles', 'success');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        // Intentar copiar al portapapeles como fallback
        try {
          const sessionUrl = `${window.location.origin}/sessions/${session.id}`;
          await navigator.clipboard.writeText(sessionUrl);
          addToast('Enlace copiado al portapapeles', 'success');
        } catch (clipboardError) {
          addToast('Error al compartir la sesión', 'error');
        }
      }
    }
  };

  return (
    <div className={`bg-white rounded-xl border p-4 sm:p-6 hover:shadow-lg transition-all duration-200 ${
      isNextSession ? 'border-blue-400 border-2 shadow-md bg-gradient-to-br from-blue-50/50 to-white' : 'border-gray-200'
    }`}>
      {isNextSession && (
        <div className="flex items-center space-x-1 mb-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-600">Próxima sesión</span>
        </div>
      )}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <span className="px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap">
              {getSessionTypeLabel(session.type)}
            </span>
            <span className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(session.status)}`}>
              {getStatusLabel(session.status)}
            </span>
            {session.priority === 'high' && (
              <span className="px-2 py-0.5 sm:py-1 bg-red-100 text-red-800 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap">
                Urgente
              </span>
            )}
            <div className="flex items-center text-[10px] sm:text-xs text-gray-500">
              {session.location_type === 'virtual' || session.location_type === 'online' || !session.location_details ? (
                <><Video className="w-3 h-3 mr-0.5 sm:mr-1" />Virtual</>
              ) : (
                <><MapPin className="w-3 h-3 mr-0.5 sm:mr-1" />Presencial</>
              )}
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">{session.title}</h3>
          <p className="text-xs sm:text-sm text-blue-600 mb-1 sm:mb-2 truncate">{session.group_name}</p>
          {session.description && (
            <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{session.description}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2 ml-2">
          {session.organizer_id === user?.id && (
            <>
              <button 
                onClick={() => {
                  if (onEditSession) {
                    onEditSession(session);
                  } else {
                    addToast('Función de edición disponible', 'info');
                  }
                }}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Editar sesión"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button 
                onClick={() => {
                  if (onDeleteSession) {
                    setShowDeleteConfirm(true);
                  } else {
                    addToast('Función de eliminación disponible', 'info');
                  }
                }}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Eliminar sesión"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="flex items-center whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">{formatSessionDate(session.scheduled_date)}</span>
            <span className="sm:hidden">{new Date(session.scheduled_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
          </span>
          <span className="flex items-center whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            {formatSessionTime(session.scheduled_date)} ({session.duration}min)
            {type === 'upcoming' && timeUntil && (
              <span className="ml-1 text-blue-600 font-medium">{timeUntil}</span>
            )}
          </span>
          <span className="flex items-center whitespace-nowrap">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            {session.attendees?.length || session.session_attendance?.length || 0}/{session.max_attendees || session.max_participants || 10}
          </span>
        </div>
        {type === 'completed' && session.average_rating && (
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
            <span className="font-medium">{session.average_rating}</span>
          </div>
        )}
      </div>

      {session.agenda && session.agenda.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 sm:mb-4">
          {session.agenda.slice(0, 3).map((item, index) => (
            <span key={index} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-700 text-[10px] sm:text-xs rounded">
              {typeof item === 'string' ? item : (item.topic || item.title || item)}
            </span>
          ))}
          {session.agenda.length > 3 && (
            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-500 text-[10px] sm:text-xs rounded">
              +{session.agenda.length - 3} más
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2 min-w-0">
          <Avatar
            userId={session.organizer?.id || session.organizer_id || 'organizer'}
            name={session.organizer_name || session.organizer?.name || 'Organizador'}
            avatar={session.organizer?.avatar_url || null}
            avatarStyle={session.organizer?.avatar || session.organizer_avatar}
            size="sm"
            showBorder={false}
            className="flex-shrink-0"
          />
          <span className="text-xs sm:text-sm text-gray-500 truncate">
            Por {session.organizer_name || session.organizer?.name || 'Organizador'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
          {type === 'upcoming' && (
            <>
              {/* Acciones rápidas */}
              <div className="flex items-center space-x-1 sm:mr-auto">
                <button
                  onClick={handleAddToCalendar}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Agregar a calendario"
                >
                  <CalendarPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Compartir sesión"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                {session.organizer_id === user?.id && (
                  <button 
                    onClick={() => {
                      if (onEditSession) {
                        onEditSession(session);
                      } else {
                        addToast('Función de edición disponible', 'info');
                      }
                    }}
                    className="w-full sm:w-auto px-3 py-1.5 sm:py-1 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs sm:text-sm transition-colors font-medium"
                  >
                    Editar
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (!canJoin) {
                      const now = new Date();
                      const scheduledDate = new Date(session.scheduled_date);
                      const joinWindowStart = new Date(scheduledDate);
                      joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 90);
                      
                      if (now < joinWindowStart) {
                        const diffMinutes = Math.ceil((joinWindowStart.getTime() - now.getTime()) / (1000 * 60));
                        const hours = Math.floor(diffMinutes / 60);
                        const mins = diffMinutes % 60;
                        
                        if (hours > 0) {
                          addToast(`Aún no puedes unirte. Disponible en ${hours}h ${mins}min`, 'warning');
                        } else {
                          addToast(`Aún no puedes unirte. Disponible en ${mins}min`, 'warning');
                        }
                      } else {
                        addToast('No se puede unir a esta sesión', 'error');
                      }
                      return;
                    }
                    onJoinSession && onJoinSession(session);
                  }}
                  disabled={sessionActionLoading || !canJoin}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm"
                  title={!canJoin ? 'La sesión aún no está disponible para unirse (90 minutos antes del inicio)' : 'Unirse a la sesión'}
                >
                  {sessionActionLoading ? 'Uniéndose...' : canJoin ? 'Unirse' : 'No disponible'}
                </button>
              </div>
            </>
          )}
          {type === 'completed' && (
            <button 
              onClick={() => {
                if (onViewSummary) {
                  onViewSummary(session);
                } else {
                  const summaryInfo = {
                    title: session.title,
                    group: session.group_name,
                    date: session.scheduled_date,
                    duration: session.duration,
                    rating: session.average_rating,
                    notes: session.session_notes,
                    xp: session.xp_earned
                  };
                  addToast(`Resumen: ${session.title} - ${session.group_name}`, 'info');
                  console.log('Resumen de sesión:', summaryInfo);
                }
              }}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm transition-colors font-semibold shadow-sm"
            >
              Ver Resumen
            </button>
          )}
        </div>
      </div>
      
      {/* Modal de confirmación para eliminar sesión */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (onDeleteSession) {
            onDeleteSession(session.id);
          }
          setShowDeleteConfirm(false);
        }}
        title="Eliminar sesión"
        message="¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default SessionCard;

