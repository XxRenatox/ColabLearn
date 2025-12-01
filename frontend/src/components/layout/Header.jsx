import React, { useState, useEffect } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import Avatar from "../ui/Avatar";

export default function Header () {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  
  // Usar el hook de usuario
  const { user, isAuthenticated, logout, fullName, initials, academicInfo } = useUser();

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset menú si la ventana crece
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock scroll cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [menuOpen]);

  // Cerrar menú de usuario cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const navItems = [
    { href: "#features", label: "Características" },
    { href: "#testimonials", label: "Testimonios" },
    { href: "#stats", label: "Comunidad" },
  ];

  const handleNavClick = () => setMenuOpen(false);

  // Función para manejar logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      // Error al cerrar sesión
    }
  };

  // Función para manejar la navegación de autenticación
  const handleAuthAction = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "transparent bg-black/80 backdrop-blur-md shadow-lg"
            : "bg-transparent backdrop-blur-none shadow-none"
        }`}
      >
        <div className="flex justify-between items-center px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 md:py-5 lg:py-6 relative z-10">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/logo.svg" 
              alt="ColabLearn Logo" 
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto"
            />
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex gap-4 lg:gap-6 xl:gap-8 text-gray-300 font-medium text-sm lg:text-base">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-indigo-400 transition-colors duration-300 relative group px-2 py-1"
              >
                {item.label}
                <span className="absolute -bottom-1 left-2 right-2 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-300 group-hover:w-full w-0"></span>
              </a>
            ))}
          </nav>

          {/* Perfil/Auth Desktop */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {isAuthenticated && user ? (
              <div className="relative user-menu-container">
                <div 
                  className="flex items-center gap-2 md:gap-2.5 lg:gap-3 bg-white/10 px-3 md:px-3.5 lg:px-4 py-1.5 md:py-2 lg:py-2.5 rounded-full border border-white/10 hover:bg-white/15 cursor-pointer transition-all"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="text-gray-300 text-xs md:text-sm lg:text-base xl:text-lg whitespace-nowrap hidden lg:inline">
                    👋 Hola, {fullName?.split(' ')[0] || 'Usuario'}
                  </span>
                  <span className="text-gray-300 text-xs md:text-sm whitespace-nowrap lg:hidden">
                    👋 {fullName?.split(' ')[0] || 'Usuario'}
                  </span>
                  <Avatar
                    userId={user?.id || user?.email || 'user'}
                    name={fullName || 'Usuario'}
                    avatar={user?.avatar_url || null}
                    avatarStyle={user?.avatar}
                    size={28}
                    showBorder={false}
                    className="shadow-md flex-shrink-0 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9"
                  />
                </div>

                {/* Menú desplegable del usuario */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 md:w-64 lg:w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 md:px-5 lg:px-6 py-3 md:py-3.5 lg:py-4 border-b border-gray-100">
                      <p className="font-medium text-gray-900 text-sm md:text-base lg:text-lg">{fullName}</p>
                      <p className="text-xs md:text-sm lg:text-base text-gray-500 mt-1">{user.email || 'Sin email'}</p>
                      {academicInfo && (
                        <p className="text-xs md:text-sm text-gray-400 mt-1">{academicInfo}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        navigate('/dashboard');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 md:px-5 lg:px-6 py-2 md:py-2.5 lg:py-3 text-left text-sm md:text-base text-gray-700 hover:bg-gray-50 flex items-center gap-2 md:gap-3 transition-colors"
                    >
                      <User className="w-4 h-4 md:w-5 md:h-5" />
                      Mi Dashboard
                    </button>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 md:px-5 lg:px-6 py-2 md:py-2.5 lg:py-3 text-left text-sm md:text-base text-red-600 hover:bg-red-50 flex items-center gap-2 md:gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                <button 
                  onClick={handleAuthAction}
                  className="text-gray-300 font-medium hover:text-indigo-400 transition-colors px-2 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 rounded-lg hover:bg-white/10 text-xs md:text-sm lg:text-base"
                >
                  Iniciar Sesión
                </button>
                <button 
                  onClick={handleAuthAction}
                  className="bg-gradient-to-r from-purple-500 to-indigo-400 text-white font-medium px-3 md:px-4 lg:px-5 xl:px-6 py-1.5 md:py-2 lg:py-2.5 rounded-full hover:from-purple-400 hover:to-indigo-300 transition-all shadow-md text-xs md:text-sm lg:text-base"
                >
                  Registro
                </button>
              </div>
            )}
          </div>

          {/* Botón Menú Mobile */}
          <button
            className="md:hidden text-gray-200 hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-white/10 flex items-center justify-center"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Menú Móvil */}
      <div
        className={`fixed top-0 right-0 h-full w-72 sm:w-80 max-w-[85vw] bg-gradient-to-b from-black/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-xl border-l border-white/10 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-16 sm:pt-20 pb-4 sm:pb-6 px-4 sm:px-6">
          {/* Header del menú móvil */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center">
              <img 
                src="/logo.svg" 
                alt="ColabLearn Logo" 
                className="h-12 w-auto"
              />
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navegación Mobile */}
          <nav className="flex flex-col gap-1 mb-6 flex-1 overflow-y-auto">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-300 text-base sm:text-lg font-medium py-3 sm:py-4 px-3 sm:px-4 rounded-xl hover:text-indigo-400 hover:bg-white/10 transition-all active:bg-white/15"
                onClick={handleNavClick}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Perfil/Auth Mobile */}
          <div className="mt-auto pt-4 border-t border-white/10">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white/10 px-3 sm:px-4 py-3 sm:py-4 rounded-xl border border-white/10">
                  <Avatar
                    userId={user?.id || user?.email || 'user'}
                    name={fullName || 'Usuario'}
                    avatar={user?.avatar_url || null}
                    avatarStyle={user?.avatar}
                    size={12}
                    showBorder={false}
                    className="shadow-md flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white font-semibold text-sm sm:text-base truncate">{fullName || 'Usuario'}</span>
                    <span className="text-gray-300 text-xs sm:text-sm truncate">{academicInfo || 'Estudiante activo'}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setMenuOpen(false);
                  }}
                  className="w-full text-gray-300 font-medium py-3 px-4 rounded-xl hover:text-indigo-400 hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Mi Dashboard
                </button>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full text-red-400 font-medium py-3 px-4 rounded-xl hover:text-red-300 hover:bg-red-500/10 transition-all border border-red-500/20 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:gap-3">
                <button 
                  onClick={() => {
                    handleAuthAction();
                    setMenuOpen(false);
                  }}
                  className="w-full text-gray-300 font-medium py-3 sm:py-4 px-4 rounded-xl hover:text-indigo-400 hover:bg-white/10 transition-all border border-white/10 active:bg-white/15"
                >
                  Iniciar Sesión
                </button>
                <button 
                  onClick={() => {
                    handleAuthAction();
                    setMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-400 text-white font-semibold py-3 sm:py-4 px-4 rounded-xl hover:from-purple-400 hover:to-indigo-300 transition-all shadow-md active:scale-95"
                >
                  Registro Gratuito
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};


