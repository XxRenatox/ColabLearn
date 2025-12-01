import React, { useState } from 'react';
import { X, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGroups } from '../../../hooks/useGroups';
import { useToast } from '../../ui/Toast';

const JoinPrivateGroupModal = ({ isOpen, onClose, group, onSuccess }) => {
  const { joinGroup, loading } = useGroups();
  const { addToast } = useToast();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('Por favor ingresa el código de invitación');
      return;
    }

    try {
      const response = await joinGroup(group.id, { inviteCode: inviteCode.trim() });
      if (response?.success) {
        // Si tiene código válido, siempre se une inmediatamente (excepción)
        addToast(
          'Te has unido al grupo exitosamente',
          'success'
        );
        if (onSuccess) {
          onSuccess({
            ...group,
            is_member: true,
            is_pending: false
          });
        }
        setInviteCode('');
        onClose();
      } else {
        throw new Error(response?.message || 'No se pudo unir al grupo');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al unirse al grupo';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Código de Invitación</h2>
                <p className="text-white/90 text-sm mt-1">{group?.name}</p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <form id="join-private-group-form" onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Este grupo requiere código de invitación</p>
                <p>Necesitas un código de invitación para unirte a este grupo.</p>
              </div>
            </div>

            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                Código de Invitación
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Ingresa el código"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  error
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                }`}
                maxLength={10}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Uniendo...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Unirse con Código
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JoinPrivateGroupModal;

