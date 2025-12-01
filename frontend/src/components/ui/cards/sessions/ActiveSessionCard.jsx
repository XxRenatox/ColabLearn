import React from 'react';
import { Users, Clock, Camera, Mic, MessageCircle, Share2 } from 'lucide-react';
import { useToast } from '../../Toast';

const ActiveSessionCard = ({ session, onJoinSession, sessionActionLoading }) => {
  const { addToast } = useToast();
  
  const timeElapsed = Math.max(0, session.timeElapsed || 0);
  const hours = Math.floor(timeElapsed / 60);
  const minutes = timeElapsed % 60;
  
  return (
    <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border-2 border-green-300 p-4 sm:p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
          <h3 className="text-sm sm:text-lg font-bold text-green-700">EN VIVO</h3>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          <span className="text-xl sm:text-2xl font-bold text-green-600 font-mono">
            {hours}:{minutes.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      
      <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{session.title}</h4>
      {session.subject && (
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Código: {session.subject}</p>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
          <span className="flex items-center">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            {session.participants || session.attendees?.length || 0} participantes
          </span>
          <span className="flex items-center">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            {session.duration} min
          </span>
        </div>
        <div className="w-full sm:w-32 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((timeElapsed / (session.duration || 120)) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {(session.type === 'online' || session.location_type === 'virtual' || !session.location_details) && (
        <div className="flex justify-center gap-2 sm:gap-3 mb-4">
          <button 
            onClick={() => {
              addToast('Micrófono activado/desactivado', 'info');
            }}
            className="p-2 sm:p-3 bg-gray-100 rounded-full hover:bg-green-100 hover:text-green-600 transition-colors"
            title="Activar/Desactivar micrófono"
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => {
              addToast('Cámara activada/desactivada', 'info');
            }}
            className="p-2 sm:p-3 bg-gray-100 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"
            title="Activar/Desactivar cámara"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => {
              addToast('Abriendo chat de la sesión...', 'info');
            }}
            className="p-2 sm:p-3 bg-gray-100 rounded-full hover:bg-purple-100 hover:text-purple-600 transition-colors"
            title="Abrir chat"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3">
        <button 
          onClick={() => onJoinSession && onJoinSession(session)}
          disabled={sessionActionLoading}
          className="flex-1 bg-green-600 text-white py-2.5 sm:py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
        >
          {sessionActionLoading ? 'Uniéndose...' : 'Unirse a la Sesión'}
        </button>
        <button className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ActiveSessionCard;

