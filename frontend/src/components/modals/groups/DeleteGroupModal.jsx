import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useGroups } from '../../../hooks/useGroups';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteGroupModal = ({ isOpen, onClose, onGroupDeleted, group }) => {
  const { deleteGroup, loading } = useGroups();
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== group?.name) {
      return;
    }

    try {
      await deleteGroup(group.id);
      
      if (onGroupDeleted) {
        onGroupDeleted(group.id);
      }
      onClose();
      setConfirmText('');
    } catch (error) {
      // Error deleting group
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen || !group) return null;

  const isConfirmValid = confirmText === group.name;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-semibold">Eliminar Grupo</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que quieres eliminar el grupo <strong>"{group.name}"</strong>?
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">Esta acción no se puede deshacer</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Se eliminarán todas las sesiones de estudio</li>
                    <li>Se perderá el historial de conversaciones</li>
                    <li>Los miembros perderán acceso al grupo</li>
                    <li>Se eliminarán todos los archivos compartidos</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Para confirmar, escribe el nombre del grupo: <strong>{group.name}</strong>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Escribe el nombre del grupo"
              />
            </div>

            {confirmText && !isConfirmValid && (
              <p className="text-sm text-red-600 mb-4">
                El nombre no coincide. Debe escribir exactamente: "{group.name}"
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || !isConfirmValid}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Grupo
                </>
              )}
            </button>
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeleteGroupModal;
