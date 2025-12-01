import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Crear contexto para los toasts
const ToastContext = createContext();

// Provider para compartir el estado de toasts
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (type, title, message, options = {}) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type,
      title,
      message,
      ...options
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove después del duration
    const duration = options.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  const value = {
    toasts,
    showToast,
    removeToast,
    removeAllToasts,
    // Métodos de conveniencia
    success: (title, message, options) => showToast('success', title, message, options),
    error: (title, message, options) => showToast('error', title, message, options),
    warning: (title, message, options) => showToast('warning', title, message, options),
    info: (title, message, options) => showToast('info', title, message, options),
    addToast: (title, type = 'info', options = {}) => showToast(type, title, '', options)
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

// Hook para usar el contexto de toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Componente individual de toast
export default function Toast({ 
  type = 'info', 
  title, 
  message, 
  isVisible, 
  onClose, 
  duration = 5000,
  position = 'top-right' 
}) {
  const [isShowing, setIsShowing] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsShowing(false);
    setTimeout(() => {
      onClose && onClose();
    }, 300);
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          titleColor: 'text-orange-800',
          messageColor: 'text-orange-700'
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (!isVisible) return null;

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 max-w-sm w-full mx-4`}>
      <div 
        className={`
          ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4
          transform transition-all duration-300 ease-in-out
          ${isShowing ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
        `}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          
          <div className="ml-3 flex-1">
            {title && (
              <h4 className={`text-sm font-medium ${config.titleColor} mb-1`}>
                {title}
              </h4>
            )}
            {message && (
              <p className={`text-sm ${config.messageColor}`}>
                {message}
              </p>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`inline-flex rounded-md p-1.5 ${config.iconColor} hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente contenedor para renderizar múltiples toasts
export function ToastContainer({ position = 'top-right' }) {
  const { toasts, removeToast } = useToast();

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2`}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={true}
          onClose={() => removeToast(toast.id)}
          duration={0} // Manejado por el hook
          position="relative" // Override position for container
        />
      ))}
    </div>
  );
}