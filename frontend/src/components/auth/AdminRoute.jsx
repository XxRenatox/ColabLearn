import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

export default function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading.user) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else if (user?.role !== 'admin') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, loading.user, navigate, user?.role]);

  if (loading.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return children;
}

