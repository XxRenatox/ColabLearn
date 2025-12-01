import React, { useState, useEffect, useMemo } from 'react';
import { useSessions } from '../../../../hooks/useSessions';
import { useToast } from '../../../ui/Toast';
import CreateSessionModal from '../../../modals/sessions/CreateSessionModal';
import EditSessionModal from '../../../modals/sessions/EditSessionModal';
import SessionSummaryModal from '../../../modals/sessions/SessionSummaryModal';
import { useSessionNotifications, requestNotificationPermission } from '../../../../hooks/useSessionNotifications';
import { useSessionCategorization } from '../sessions/useSessionCategorization';
import ActiveSessionCard from '../../../ui/cards/sessions/ActiveSessionCard';
import SessionCard from '../../../ui/cards/sessions/SessionCard';
import { 
  Calendar, 
  Video,
  Plus,
  Filter,
  Search,
  CheckCircle,
} from 'lucide-react';

const StudySessionsPanel = ({ user, sessions = [], groups = [], onJoinSession, onSessionsUpdated }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSessionForSummary, setSelectedSessionForSummary] = useState(null);
  const [selectedSessionForEdit, setSelectedSessionForEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { joinSession, deleteSession, updateSession, loading: sessionActionLoading } = useSessions();
  const { addToast } = useToast();

  // Filtrar grupos donde el usuario es admin o moderador
  const availableGroupsForSessions = useMemo(() => {
    return groups.filter((g) => {
      const userRole = g.userRole || g.role || g.user_role;
      return ['admin', 'moderator'].includes(userRole);
    });
  }, [groups]);

  // Solicitar permisos de notificación y monitorear sesiones
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Hook para notificaciones de sesiones 1 hora antes
  useSessionNotifications(sessions);

  // Categorizar sesiones usando el hook personalizado
  const categorizedSessions = useSessionCategorization(sessions, user);

  const handleSessionCreated = async (newSession) => {
    // Cerrar el modal primero
    setShowCreateModal(false);
    
    // Recargar sesiones - hacer la petición inmediatamente
    if (onSessionsUpdated) {
      try {
        await onSessionsUpdated();
      } catch (error) {
        console.error('Error recargando sesiones:', error);
      }
      
      // Recargar nuevamente después de un breve delay para asegurar que la sesión esté disponible
      setTimeout(async () => {
        if (onSessionsUpdated) {
          try {
            await onSessionsUpdated();
          } catch (error) {
            console.error('Error en recarga secundaria de sesiones:', error);
          }
        }
      }, 1000);
    }
  };

  const handleSessionUpdated = async (updatedSession) => {
    setSelectedSessionForEdit(null);
    // Recargar sesiones para reflejar los cambios
    if (onSessionsUpdated) {
      try {
        await onSessionsUpdated();
      } catch (error) {
        console.error('Error recargando sesiones:', error);
      }
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteSession(sessionId);
      if (onSessionsUpdated) {
        onSessionsUpdated();
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  // Filtrar sesiones por búsqueda y tipo
  const filterSessions = (sessionList) => {
    return sessionList.filter(session => {
      const matchesSearch = searchQuery === '' || 
        session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.group_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || session.type === filterType;
      
      return matchesSearch && matchesType;
    });
  };

  const handleJoinSession = async (session) => {
    try {
      // Si hay un callback del padre, usarlo (para manejar navegación)
      if (onJoinSession) {
        await onJoinSession(session);
      } else {
        // Si no, usar el hook local
        await joinSession(session.id);
        addToast('Te has unido a la sesión exitosamente', 'success');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al unirse a la sesión';
      addToast(errorMessage, 'error');
    }
  };

  return (
    <div className="w-full p-3 sm:p-6">
      {/* Header Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end mb-4 sm:mb-8 gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:space-x-3">
          {/* Búsqueda */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar sesiones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64"
            />
          </div>
          {/* Botón de búsqueda móvil */}
          <button
            onClick={() => {
              const query = prompt('Buscar sesiones:');
              if (query !== null) setSearchQuery(query);
            }}
            className="md:hidden p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Buscar"
          >
            <Search className="w-5 h-5 text-gray-500" />
          </button>
          {/* Filtro por tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Todos los tipos</option>
            <option value="study">Estudio</option>
            <option value="review">Repaso</option>
            <option value="exam_prep">Prep. Examen</option>
            <option value="project">Proyecto</option>
            <option value="discussion">Discusión</option>
            <option value="tutoring">Tutoría</option>
          </select>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Sesión</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {/* Pestañas - Scrollable en móvil */}
      <div className="border-b border-gray-200 mb-4 sm:mb-8 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
          {[
            { id: 'upcoming', label: 'Próximas', count: categorizedSessions.upcoming.length },
            { id: 'active', label: 'En Vivo', count: categorizedSessions.active.length },
            { id: 'completed', label: 'Completadas', count: categorizedSessions.completed.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-1.5 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-[10px] sm:text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      <div className="space-y-4 sm:space-y-6">
        {activeTab === 'upcoming' && (
          <>
            {filterSessions(categorizedSessions.upcoming).length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {filterSessions(categorizedSessions.upcoming).map((session, index) => (
                  <SessionCard 
                    key={session.id} 
                    session={session} 
                    type="upcoming"
                    onJoinSession={handleJoinSession}
                    sessionActionLoading={sessionActionLoading}
                    isNextSession={index === 0}
                    onEditSession={setSelectedSessionForEdit}
                    onDeleteSession={handleDeleteSession}
                    user={user}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                <Calendar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" />
                <p className="text-lg sm:text-xl font-medium text-gray-700 mb-2">No hay sesiones próximas</p>
                <p className="text-sm sm:text-base text-gray-500">Las sesiones programadas aparecerán aquí</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'active' && (
          <>
            {filterSessions(categorizedSessions.active).length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {filterSessions(categorizedSessions.active).map(session => (
                  <ActiveSessionCard 
                    key={session.id} 
                    session={session}
                    onJoinSession={handleJoinSession}
                    sessionActionLoading={sessionActionLoading}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                <Video className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" />
                <p className="text-lg sm:text-xl font-medium text-gray-700 mb-2">No hay sesiones activas</p>
                <p className="text-sm sm:text-base text-gray-500">Las sesiones en vivo aparecerán aquí</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'completed' && (
          <>
            {filterSessions(categorizedSessions.completed).length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {filterSessions(categorizedSessions.completed).map(session => (
                  <SessionCard 
                    key={session.id} 
                    session={session} 
                    type="completed"
                    onViewSummary={(session) => {
                      setSelectedSessionForSummary(session);
                    }}
                    onEditSession={setSelectedSessionForEdit}
                    onDeleteSession={handleDeleteSession}
                    user={user}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" />
                <p className="text-lg sm:text-xl font-medium text-gray-700 mb-2">No hay sesiones completadas</p>
                <p className="text-sm sm:text-base text-gray-500">Las sesiones terminadas aparecerán aquí</p>
              </div>
            )}
          </>
        )}

      </div>

      {/* Modal de crear sesión */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSessionCreated={handleSessionCreated}
        availableGroups={availableGroupsForSessions}
      />

      {/* Modal de editar sesión */}
      <EditSessionModal
        isOpen={!!selectedSessionForEdit}
        onClose={() => setSelectedSessionForEdit(null)}
        session={selectedSessionForEdit}
        onSessionUpdated={handleSessionUpdated}
      />

      {/* Modal de resumen de sesión */}
      <SessionSummaryModal
        isOpen={!!selectedSessionForSummary}
        onClose={() => setSelectedSessionForSummary(null)}
        session={selectedSessionForSummary}
      />
    </div>
  );
};

export default StudySessionsPanel;
