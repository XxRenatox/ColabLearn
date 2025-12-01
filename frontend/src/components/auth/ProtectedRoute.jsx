import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // Si no está cargando y no está autenticado, redirigir al login
    if (!loading.user && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Si el usuario es admin y está intentando acceder a /dashboard, redirigir a /admin
    if (!loading.user && isAuthenticated && user?.role === 'admin') {
      const currentPath = window.location.pathname;
      if (currentPath === '/dashboard' || currentPath.startsWith('/dashboard')) {
        navigate('/admin', { replace: true });
      }
    }
  }, [isAuthenticated, loading.user, navigate, user]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada (se está redirigiendo)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Si está autenticado, renderizar los children
  return children;
}
