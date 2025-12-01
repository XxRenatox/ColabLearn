import React from "react";
import { BookOpen, X, LogOut, Menu } from "lucide-react";
import { LevelProgressBar } from "../ui/ProgressBar";
import { Link } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import Avatar from "../ui/Avatar";

export const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  user,
  menuItems,
  activeTab,
  setActiveTab,
}) => {
  const { logout } = useApp();

  const handleMenuItemClick = (item) => {
    if (item?.onClick) {
      item.onClick();
    } else if (item?.id) {
      setActiveTab(item.id);
    }
    // Auto-close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // La redirección se maneja automáticamente en el Context
    } catch (error) {
      // Error al cerrar sesión
    }
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Link to="/"  className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ColabLearn
              </span>
            </Link>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex flex-col h-full overflow-y-auto pb-20 lg:pb-6">
          {/* User Profile */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar
                userId={user.id || user.email || 'user'}
                name={user.name || user.username || 'Usuario'}
                avatar={user.avatar_url || null}
                avatarStyle={user.avatar}
                size="lg"
                showBorder={false}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                  {user.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {user.career}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Nivel {user.level}</span>
                <span className="font-medium text-blue-600">{user.xp} XP</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <LevelProgressBar xp={user.xp} level={user.level} />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-6 mb-20 px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item)}
                  className={`w-full flex items-center px-3 py-3 text-left rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.hasIndicator && (
                    <div className="ml-auto flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white border-t border-gray-100 ">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-sm"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};

// Mobile Menu Toggle Button Component (to be used in your main layout)
export const MobileMenuButton = ({ setSidebarOpen }) => (
  <button
    onClick={() => setSidebarOpen(true)}
    className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
    aria-label="Abrir menú"
  >
    <Menu className="w-6 h-6" />
  </button>
);
