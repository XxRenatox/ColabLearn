import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Layers,
  Calendar,
  FileText,
  MessageSquare,
  Activity,
  LogOut,
  Shield,
  X,
  Menu,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import Avatar from '@/components/ui/Avatar';

export const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useApp();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
      section: 'dashboard',
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: Users,
      path: '/admin',
      section: 'users',
    },
    {
      id: 'groups',
      label: 'Grupos',
      icon: Layers,
      path: '/admin',
      section: 'groups',
    },
    {
      id: 'sessions',
      label: 'Sesiones',
      icon: Calendar,
      path: '/admin',
      section: 'sessions',
    },
    {
      id: 'resources',
      label: 'Recursos',
      icon: FileText,
      path: '/admin',
      section: 'resources',
    },
    {
      id: 'forums',
      label: 'Foros',
      icon: MessageSquare,
      path: '/admin',
      section: 'forums',
    },
    {
      id: 'logs',
      label: 'Logs del Sistema',
      icon: Activity,
      path: '/admin',
      section: 'logs',
    },
  ];

  const handleLogout = async () => {
    // Prevenir múltiples clics
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await logout();
      // Redirigir después del logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoggingOut(false);
    }
  };

  const isActive = (section) => {
    // Si estamos en /admin y no hay hash, el dashboard es activo por defecto
    if (location.pathname === '/admin' && !location.hash) {
      return section === 'dashboard';
    }
    const hash = location.hash.replace('#', '');
    return hash === section || (!hash && section === 'dashboard');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {/* Navigation */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.section);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.section) {
                      // Cambiar el hash de la URL para que el componente principal detecte el cambio
                      window.location.hash = item.section;
                      // También disparar evento hashchange manualmente para asegurar que se detecte
                      window.dispatchEvent(new HashChangeEvent('hashchange'));
                    }
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className={`w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
            <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
          </button>
        </div>
      </div >
    </>
  );
};

