import React, { useState, useEffect } from 'react';
import { 
    BookOpen, 
    Users, 
    Trophy,
    Calendar,
    Bell,
    Search,
    User,
    Home,
    BarChart3,
    GraduationCap,
    CheckCircle,
    Menu,
    Flame,
    Clock,
    FileText,
    MessageSquare,
    ShieldCheck
} from 'lucide-react';
import { useLocation, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

// Import your existing components
import Dashboard from '../components/ui/dashboard/sections/DashboardSection';
import Groups from '../components/ui/dashboard/sections/GroupsSection';
import Achievements from '../components/ui/dashboard/sections/AchievementsSection';
import DefaultSection from '../components/ui/dashboard/shared/DefaultSection';
import CalendarSection from '../components/ui/dashboard/calendar/CalendarSection';
import ExplorerSection from '../components/ui/dashboard/sections/ExplorerSection';
import StudySessionsPanel from '../components/ui/dashboard/sections/StudySessionSection';
import NotificationsSection from '../components/ui/dashboard/sections/NotificationsSection';
import ResourcesSection from '../components/ui/dashboard/sections/ResourcesSection';
import ForumsSection from '../components/ui/dashboard/sections/ForumsSection';
import UserProfile from '../components/ui/dashboard/sections/UserProfile';
import ActiveSessionSection from '../components/ui/dashboard/sessions/ActiveSessionSection';
import GroupDetailSection from '../components/ui/dashboard/shared/GroupDetailSection'; 
import FriendlyErrorBoundary from '../components/ui/FriendlyErrorBoundary';
import { Sidebar } from '../components/layout/Sidebar';
import { getAuthToken } from '../services/tokenManager';

export default function ColabLearnUserPanel() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Usar el contexto global
  const { 
    user, 
    isAuthenticated, 
    groups, 
    sessions, 
    notifications, 
    achievements, 
    userAchievements,
    loading,
    errors,
    isConnected,
    loadUserData,
    loadSessions
  } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGroupId = searchParams.get('group');

  // Verificar autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Cargar datos si no están disponibles
  useEffect(() => {
    if (isAuthenticated && user && (!groups.length || !sessions.length)) {
      loadUserData();
    }
  }, [isAuthenticated, user]);

  // Procesar datos del backend
  const upcomingSessions = sessions
    .filter(session => session.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 5)
    .map(session => ({
      id: session.id,
      title: session.title,
      group: session.groups?.name || 'Sin grupo',
      time: new Date(session.scheduled_date).toLocaleDateString('es-ES', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      duration: `${session.duration} min`,
      participants: session.max_attendees || 0,
      priority: session.priority || 'medium'
    }));

  // Actividad reciente basada en notificaciones
  const recentActivity = notifications
    .slice(0, 5)
    .map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      description: notification.message,
      time: new Date(notification.created_at).toLocaleDateString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      icon: notification.type === 'achievement_unlock' ? Trophy :
            notification.type === 'group_invite' ? Users :
            notification.type === 'session_reminder' ? Clock : Bell,
      color: notification.type === 'achievement_unlock' ? 'text-yellow-500' :
             notification.type === 'group_invite' ? 'text-blue-500' :
             notification.type === 'session_reminder' ? 'text-green-500' : 'text-gray-500'
    }));

  // Combinar logros disponibles con los del usuario
  const processedAchievements = achievements.map(achievement => {
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
    return {
      ...achievement,
      unlocked: !!userAchievement?.unlocked_at,
      unlockedAt: userAchievement?.unlocked_at
    };
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'achievements', label: 'Logros', icon: Trophy },

    { id: 'groups', label: 'Mis Grupos', icon: Users },
    { id: 'find-students', label: 'Explorar Comunidad', icon: Search },
    { id: 'forums', label: 'Foros', icon: MessageSquare },
    { id: 'resources', label: 'Recursos', icon: FileText },
    { id: 'study-sessions', label: 'Sesiones de Estudio', icon: Clock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },

    ...(activeSession ? [{
      id: 'active-session',
      label: 'Sesión Activa',
      icon: GraduationCap,
      hasIndicator: true
    }] : []),

    { id: 'profile', label: 'Perfil', icon: User },
    ...(user?.role === 'admin'
      ? [
          {
            id: 'admin-panel-link',
            label: 'Panel Administrador',
            icon: ShieldCheck,
            onClick: () => navigate('/admin'),
          },
        ]
      : []),
  ];

  const handleBackToGroups = () => {
    setActiveTab('groups');
    navigate('/user/panel?tab=groups');
  };
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const renderContent = () => {
  if (loading.user || loading.groups || loading.sessions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Back button component
  const BackButton = ({ onClick, text = 'Volver a mis grupos' }) => (
    <button 
      onClick={onClick}
      className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
    >
      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {text}
    </button>
  );

  // Si tenemos un groupId en la URL, mostrar detalle del grupo
  if (selectedGroupId) {
    // Buscar el grupo por ID dentro de los grupos cargados
    const selectedGroup = groups.find(g => g.id === selectedGroupId);


    // Si el grupo fue encontrado correctamente
    return (
      <div className="space-y-6">
        <BackButton onClick={handleBackToGroups} text="XD" />
        <GroupDetailSection group={selectedGroup} />
      </div>
    );
  }

  switch (activeTab) {
    case 'dashboard':
      return (
        <Dashboard 
          user={user}
          sessions={sessions}
          groups={groups}
          achievements={processedAchievements}
          upcomingSessions={upcomingSessions}
          recentActivity={recentActivity}
          loading={loading}
          activeSession={activeSession}
          onLeaveSession={() => {
            setActiveSession(null);
            setActiveTab('dashboard');
          }}
        />
      );

    case 'achievements':
      return <Achievements achievements={processedAchievements} loading={loading.achievements} />;

    case 'calendar':
      return (
        <CalendarSection
          user={user}
          sessions={sessions}
          groups={groups}
          onJoinSession={async (session) => {
            try {
              await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sessions/${session.id}/join`,
                { method: 'POST', headers: { Authorization: `Bearer ${getAuthToken()}` } }
              );
              const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sessions/${session.id}`,
                { headers: { Authorization: `Bearer ${getAuthToken()}` } }
              );
              if (response.ok) {
                const data = await response.json();
                setActiveSession(data.data.session);
                setActiveTab('active-session');
              } else {
                setActiveSession(session);
                setActiveTab('active-session');
              }
            } catch (error) {
              setActiveSession(session);
              setActiveTab('active-session');
            }
          }}
        />
      );

    case 'find-students':
      return <ExplorerSection user={user} groups={groups} />;

    case 'groups':
      return <Groups user={user} studyGroups={groups} loading={loading.groups} />;

    case 'forums':
      return <ForumsSection user={user} groups={groups} />;

    case 'resources':
      return <ResourcesSection user={user} token={getAuthToken()} />;

    case 'study-sessions':
      return (
        <StudySessionsPanel
          user={user}
          sessions={sessions}
          groups={groups}
          onSessionsUpdated={loadSessions}
          onJoinSession={async (session) => {
            try {
              await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sessions/${session.id}/join`,
                { method: 'POST', headers: { Authorization: `Bearer ${getAuthToken()}` } }
              );
              const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sessions/${session.id}`,
                { headers: { Authorization: `Bearer ${getAuthToken()}` } }
              );
              if (response.ok) {
                const data = await response.json();
                setActiveSession(data.data.session);
                setActiveTab('active-session');
              } else {
                setActiveSession(session);
                setActiveTab('active-session');
              }
            } catch (error) {
              setActiveSession(session);
              setActiveTab('active-session');
            }
          }}
        />
      );

    case 'notifications':
      return <NotificationsSection notifications={notifications} loading={loading.notifications} />;

    case 'active-session':
      return (
        <ActiveSessionSection
          session={activeSession}
          user={user}
          onLeaveSession={() => {
            setActiveSession(null);
            setActiveTab('dashboard');
          }}
        />
      );

    case 'profile':
      return (
        <UserProfile
          user={user}
          userAchievements={userAchievements}
          achievements={achievements}
          loading={loading}
          groups={groups}
          sessions={sessions}
        />
      );

    default:
      return <DefaultSection />;
  }
};

  const activeItem = menuItems.find(item => item.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        menuItems={menuItems} 
        setSidebarOpen={setSidebarOpen} 
        sidebarOpen={sidebarOpen} 
        setActiveTab={setActiveTab} 
        activeTab={activeTab} 
        user={user} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" 
                aria-label="Abrir menú"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 capitalize">
                  {activeItem ? activeItem.label : 'Dashboard'}
                </h1>
                <p className="text-sm sm:text-base text-gray-500 hidden sm:block">
                  {activeTab === 'dashboard' && 'Bienvenido a tu espacio de estudio'}
                  {activeTab === 'calendar' && 'Organiza tus sesiones de estudio'}
                  {activeTab === 'achievements' && 'Tus logros y reconocimientos'}
                  {activeTab === 'groups' && 'Gestiona tus grupos de estudio'}
                  {activeTab === 'find-students' && 'Descubre grupos de estudio en tu comunidad'}
                  {activeTab === 'forums' && 'Discute y comparte conocimientos con la comunidad'}
                  {activeTab === 'resources' && 'Accede a recursos compartidos por la comunidad'}
                  {activeTab === 'study-sessions' && 'Programa y únete a sesiones'}
                  {activeTab === 'notifications' && 'Mantente al día con las novedades'}
                  {activeTab === 'active-session' && `Sesión activa: ${activeSession?.title || ''}`}
                  {activeTab === 'profile' && 'Ve tu información personal y logros'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64" 
                />
              </div>
              <button className="sm:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button 
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <FriendlyErrorBoundary>
            {renderContent()}
          </FriendlyErrorBoundary>
        </main>
      </div>
    </div>
  );
}
