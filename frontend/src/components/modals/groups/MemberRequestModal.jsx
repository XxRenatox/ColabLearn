import React, { useState } from 'react';
import { X, User, Mail, GraduationCap, Calendar, Award, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { groupsAPI } from '../../../services/api';
import { useToast } from '../../ui/Toast';

const MemberRequestModal = ({ isOpen, onClose, pendingMember, groupId, onApproved, onRejected }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !pendingMember) return null;

  const user = pendingMember.user || {};
  const requestDate = pendingMember.joined_at
    ? new Date(pendingMember.joined_at).toLocaleString('es-ES')
    : 'Fecha desconocida';

  const handleApprove = async () => {
    try {
      setLoading(true);
      const response = await groupsAPI.approveMember(groupId, pendingMember.id);
      
      // apiRequest ya devuelve response.data, que contiene { success, message }
      addToast(
        response?.message || 'Solicitud aprobada exitosamente', 
        'success'
      );
      
      if (onApproved) {
        onApproved(pendingMember.id);
      }
      onClose();
    } catch (error) {
      // Solo mostrar error si realmente hubo un error
      const errorMessage = error.response?.data?.message || error.message || 'Error al aprobar la solicitud';
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const response = await groupsAPI.rejectMember(groupId, pendingMember.id);
      
      // apiRequest ya devuelve response.data, que contiene { success, message }
      addToast(
        response?.message || 'Solicitud rechazada exitosamente', 
        'success'
      );
      
      if (onRejected) {
        onRejected(pendingMember.id);
      }
      onClose();
    } catch (error) {
      // Solo mostrar error si realmente hubo un error
      const errorMessage = error.response?.data?.message || error.message || 'Error al rechazar la solicitud';
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Perfil del Solicitante</h2>
                <p className="text-white/90 text-sm mt-1">Revisa la información antes de tomar una decisión</p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Información del Usuario */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-2xl font-semibold text-white shadow-lg">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{user.name || 'Usuario'}</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{user.email || 'Sin correo'}</span>
                    </div>
                    {user.university && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <GraduationCap className="w-4 h-4" />
                        <span>{user.university}</span>
                      </div>
                    )}
                    {user.career && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Award className="w-4 h-4" />
                        <span>{user.career} {user.semester && `• Semestre ${user.semester}`}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas del Usuario */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-medium">Nivel</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{user.level || 1}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Sesiones</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{user.total_sessions || 0}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Horas de Estudio</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{user.study_hours ? parseFloat(user.study_hours).toFixed(1) : '0.0'}h</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-medium">XP</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{user.xp || 0}</p>
              </div>
            </div>

            {/* Información de la Solicitud */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Información de la Solicitud</p>
                  <p>Solicitud enviada el: {requestDate}</p>
                  {user.last_active && (
                    <p className="mt-1">Última actividad: {new Date(user.last_active).toLocaleString('es-ES')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 p-4 flex gap-3">
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              {loading ? 'Rechazando...' : 'Rechazar'}
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Aprobar Solicitud
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MemberRequestModal;

