import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Avatar from '../../ui/Avatar';
import { useToast } from '../../ui/Toast';
import { usersAPI } from '../../../services/api';
import { useApp } from '../../../contexts/AppContext';

const DICEBEAR_STYLES = [
  { id: 'adventurer', name: 'Aventurero', preview: 'adventurer' },
  { id: 'avataaars', name: 'Avataaars', preview: 'avataaars' },
  { id: 'big-smile', name: 'Gran Sonrisa', preview: 'big-smile' },
  { id: 'bottts', name: 'Robot', preview: 'bottts' },
  { id: 'fun-emoji', name: 'Emoji Divertido', preview: 'fun-emoji' },
  { id: 'icons', name: 'Iconos', preview: 'icons' },
  { id: 'identicon', name: 'Identicon', preview: 'identicon' },
  { id: 'lorelei', name: 'Lorelei', preview: 'lorelei' },
  { id: 'micah', name: 'Micah', preview: 'micah' },
  { id: 'miniavs', name: 'Mini Avatares', preview: 'miniavs' },
  { id: 'open-peeps', name: 'Open Peeps', preview: 'open-peeps' },
  { id: 'personas', name: 'Personas', preview: 'personas' },
  { id: 'pixel-art', name: 'Pixel Art', preview: 'pixel-art' },
  { id: 'shapes', name: 'Formas', preview: 'shapes' },
  { id: 'thumbs', name: 'Pulgares', preview: 'thumbs' },
];

const ChangeAvatarModal = ({ isOpen, onClose, user, onAvatarChanged }) => {
  const [selectedStyle, setSelectedStyle] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const { updateUser } = useApp();

  useEffect(() => {
    if (isOpen && user) {
      setSelectedStyle(user?.avatar || null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Actualizar en el backend y en el contexto global
      const updatedUser = await updateUser({
        avatar: selectedStyle
      });

      addToast('Avatar actualizado exitosamente', 'success');

      // También llamar al callback local si existe
      if (onAvatarChanged) {
        onAvatarChanged(updatedUser || { ...user, avatar: selectedStyle });
      }

      onClose();
    } catch (error) {
      console.error('Error actualizando avatar:', error);
      addToast('Error al actualizar el avatar. Intenta nuevamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStyle = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Actualizar en el backend y en el contexto global
      const updatedUser = await updateUser({
        avatar: null
      });

      addToast('Avatar restablecido a iniciales', 'success');

      // También llamar al callback local si existe
      if (onAvatarChanged) {
        onAvatarChanged(updatedUser || { ...user, avatar: null });
      }

      onClose();
    } catch (error) {
      console.error('Error removiendo avatar:', error);
      addToast('Error al remover el avatar. Intenta nuevamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">Cambiar Avatar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Preview */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-600 mb-4">Vista previa</p>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <Avatar
                  userId={user?.id || user?.email || 'user'}
                  name={user?.name || 'Usuario'}
                  avatar={null}
                  avatarStyle={selectedStyle}
                  size={24}
                  showBorder={true}
                />
                <p className="text-xs text-gray-500 mt-2">Con estilo</p>
              </div>
              <div className="text-center">
                <Avatar
                  userId={user?.id || user?.email || 'user'}
                  name={user?.name || 'Usuario'}
                  avatar={null}
                  avatarStyle={null}
                  size={24}
                  showBorder={true}
                />
                <p className="text-xs text-gray-500 mt-2">Solo iniciales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Styles Grid */}
        <div className="px-6 py-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Selecciona un estilo de DiceBear</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {DICEBEAR_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${selectedStyle === style.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <Avatar
                    userId={user?.id || user?.email || 'user'}
                    name={user?.name || 'Usuario'}
                    avatar={null}
                    avatarStyle={style.id}
                    size={24}
                    showBorder={false}
                  />
                  <span className="text-xs text-gray-700 text-center font-medium">
                    {style.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleRemoveStyle}
            disabled={saving || !user?.avatar_style}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Usar iniciales
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeAvatarModal;

