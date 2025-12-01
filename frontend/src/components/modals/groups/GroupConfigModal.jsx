import React, { useState, useEffect } from 'react';
import { X, Settings, Save, Eye, EyeOff, Users, Lock, Unlock } from 'lucide-react';
import { useGroups } from '../../../hooks/useGroups';

const GroupConfigModal = ({ isOpen, onClose, group, onGroupUpdated }) => {
  const { updateGroup } = useGroups();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    color: '#3B82F6',
    max_members: 20,
    is_private: false,
    allow_invites: true,
    require_approval: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (group && isOpen) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        subject: group.subject || '',
        color: group.color || '#3B82F6',
        max_members: group.max_members || 20,
        is_private: group.is_private || false,
        allow_invites: group.allow_invites !== undefined ? group.allow_invites : true,
        require_approval: group.require_approval || false
      });
      setErrors({});
    }
  }, [group, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'La materia es obligatoria';
    }

    if (formData.max_members < 2 || formData.max_members > 100) {
      newErrors.max_members = 'El máximo de miembros debe estar entre 2 y 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await updateGroup(group.id, formData);

      if (onGroupUpdated) {
        onGroupUpdated(response.data.group);
      }

      onClose();
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configuración del Grupo</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Nombre del grupo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Grupo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ingresa el nombre del grupo"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe el propósito y objetivos del grupo"
            />
          </div>

          {/* Materia y Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materia *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.subject ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Matemáticas, Física, etc."
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color del Grupo
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>

          {/* Configuración de miembros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máximo de Miembros
              </label>
              <input
                type="number"
                min="2"
                max="100"
                value={formData.max_members}
                onChange={(e) => handleInputChange('max_members', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.max_members ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.max_members && (
                <p className="mt-1 text-sm text-red-600">{errors.max_members}</p>
              )}
            </div>
          </div>

          {/* Configuración de privacidad */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Configuración de Privacidad</h3>

            {/* Grupo Privado */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {formData.is_private ? (
                  <Lock className="w-5 h-5 text-orange-600" />
                ) : (
                  <Unlock className="w-5 h-5 text-green-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    Grupo {formData.is_private ? 'Privado' : 'Público'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formData.is_private
                      ? 'Solo miembros pueden ver el grupo y unirse con invitación'
                      : 'Cualquier usuario puede ver y solicitar unirse al grupo'
                    }
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_private}
                  onChange={(e) => handleInputChange('is_private', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Permitir Invitaciones */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Permitir Invitaciones</p>
                  <p className="text-sm text-gray-600">
                    Los miembros pueden invitar a otros usuarios al grupo
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_invites}
                  onChange={(e) => handleInputChange('allow_invites', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Requerir Aprobación */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Aprobación Requerida</p>
                  <p className="text-sm text-gray-600">
                    Los nuevos miembros deben ser aprobados por un administrador
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.require_approval}
                  onChange={(e) => handleInputChange('require_approval', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupConfigModal;
