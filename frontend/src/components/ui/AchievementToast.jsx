import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

export const AchievementToast = ({ achievement, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  
  // Cerrar automáticamente después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    // Esperar a que termine la animación de salida antes de llamar a onClose
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div 
      className={`fixed bottom-6 right-6 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 transform transition-all duration-300 ${
        isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg text-white">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">¡Logro desbloqueado!</p>
            <p className="mt-1 text-sm text-gray-600">{achievement.name}</p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="progress-bar bg-gradient-to-r from-yellow-400 to-orange-500 h-full"></div>
              </div>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Cerrar</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;
