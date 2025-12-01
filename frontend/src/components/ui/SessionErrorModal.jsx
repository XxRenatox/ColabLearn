import React from 'react';
import { AlertTriangle, RefreshCw, LogIn, X } from 'lucide-react';

export default function SessionErrorModal({ 
  isOpen, 
  onClose, 
  errorType = 'session_expired', 
  onRetry,
  onLogin 
}) {
  if (!isOpen) return null;

  const getErrorConfig = () => {
    switch (errorType) {
      case 'session_expired':
        return {
          title: 'Sesión Expirada',
          message: 'Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente.',
          icon: AlertTriangle,
          iconColor: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'unauthorized':
        return {
          title: 'Acceso No Autorizado',
          message: 'No tienes permisos para acceder a esta sección. Inicia sesión para continuar.',
          icon: AlertTriangle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'network_error':
        return {
          title: 'Error de Conexión',
          message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
          icon: RefreshCw,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'server_error':
        return {
          title: 'Error del Servidor',
          message: 'Ocurrió un error en el servidor. Por favor, intenta nuevamente.',
          icon: AlertTriangle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          title: 'Error',
          message: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
          icon: AlertTriangle,
          iconColor: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${config.bgColor} ${config.borderColor} border flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 leading-relaxed">
            {config.message}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {errorType === 'network_error' || errorType === 'server_error' ? (
              <>
                <button
                  onClick={onRetry}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onLogin}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para usar el modal de errores de sesión
export function useSessionError() {
  const [error, setError] = React.useState(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const showError = (errorType, customMessage) => {
    setError({ type: errorType, message: customMessage });
    setIsOpen(true);
  };

  const hideError = () => {
    setIsOpen(false);
    setError(null);
  };

  return {
    error,
    isOpen,
    showError,
    hideError
  };
}
