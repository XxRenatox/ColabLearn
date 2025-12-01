import React, { useState, useEffect } from 'react';
import { X, Users, BookOpen, Globe, Lock, Save } from 'lucide-react';
import { useGroups } from '../../../hooks/useGroups';
import { motion, AnimatePresence } from 'framer-motion';

const EditGroupModal = ({ isOpen, onClose, onGroupUpdated, group }) => {
  const { updateGroup, loading } = useGroups();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    university: '',
    career: '',
    semester: '',
    maxMembers: 20,
    isPrivate: false,
    allowInvites: true,
    requireApproval: false,
    color: 'bg-blue-500'
  });


  const colorOptions = [
    { value: 'bg-blue-500', label: 'Azul', color: 'bg-blue-500' },
    { value: 'bg-green-500', label: 'Verde', color: 'bg-green-500' },
    { value: 'bg-purple-500', label: 'Morado', color: 'bg-purple-500' },
    { value: 'bg-red-500', label: 'Rojo', color: 'bg-red-500' },
    { value: 'bg-yellow-500', label: 'Amarillo', color: 'bg-yellow-500' },
    { value: 'bg-indigo-500', label: 'Índigo', color: 'bg-indigo-500' },
  ];

  // Cargar datos del grupo cuando se abre el modal
  useEffect(() => {
    if (isOpen && group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        subject: group.subject || '',
        university: group.university || '',
        career: group.career || '',
        semester: group.semester || '',
        maxMembers: group.max_members || 20,
        isPrivate: Boolean(group.is_private),
        allowInvites: group.allow_invites !== undefined ? Boolean(group.allow_invites) : true,
        requireApproval: group.require_approval !== undefined ? Boolean(group.require_approval) : false,
        color: group.color || 'bg-blue-500'
      });
    }
  }, [isOpen, group]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Mapear datos del formulario al formato esperado por el backend
      const groupData = {
        name: formData.name,
        description: formData.description,
        subject: formData.subject,
        university: formData.university,
        career: formData.career,
        semester: formData.semester,
        max_members: formData.maxMembers,
        is_private: Boolean(formData.isPrivate),
        allow_invites: Boolean(formData.allowInvites),
        require_approval: Boolean(formData.requireApproval),
        color: formData.color
      };

      const response = await updateGroup(group.id, groupData);
      
      // Extraer el grupo actualizado de la respuesta
      const updatedGroupData = response?.data?.group || response?.group || response;

      if (onGroupUpdated) {
        // Pasar el grupo completo actualizado
        onGroupUpdated(updatedGroupData || response);
      }
      onClose();
    } catch (error) {
      // Error updating group
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };


  if (!isOpen || !group) return null;

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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Editar Grupo</h2>
              <p className="text-blue-100 text-sm mt-1">Actualiza la información del grupo</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form id="edit-group-form" onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Nombre del grupo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Grupo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              maxLength={150}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Grupo de Cálculo Diferencial"
            />
          </div>

          {/* Materia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Materia *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Cálculo Diferencial"
            />
          </div>

          {/* Universidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Universidad *
            </label>
            <input
              type="text"
              name="university"
              value={formData.university}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Universidad de Chile"
            />
          </div>

          {/* Carrera y Semestre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carrera *
              </label>
              <input
                type="text"
                name="career"
                value={formData.career}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Ingeniería Civil"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semestre *
              </label>
              <input
                type="text"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 3er Semestre"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe el propósito y objetivos del grupo..."
            />
          </div>

          {/* Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Máximo de miembros */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Máximo de Miembros
              </label>
              <input
                type="number"
                name="maxMembers"
                value={formData.maxMembers}
                onChange={handleInputChange}
                min={2}
                max={50}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Color del grupo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color del Grupo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.color === option.value
                        ? 'border-gray-900 scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 ${option.color} rounded-full mx-auto`}></div>
                    <span className="text-xs mt-1 block">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Configuraciones del Grupo */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Configuraciones del Grupo</h4>
            
            {/* Permitir invitaciones */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Permitir Invitaciones</h5>
                <p className="text-sm text-gray-600">Los miembros pueden invitar a otros estudiantes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="allowInvites"
                  checked={formData.allowInvites}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {/* Requerir aprobación */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Requerir Aprobación</h5>
                <p className="text-sm text-gray-600">Los nuevos miembros necesitan aprobación para unirse</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="requireApproval"
                  checked={formData.requireApproval === true}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Privacidad */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {formData.isPrivate ? (
                <Lock className="w-5 h-5 text-gray-600" />
              ) : (
                <Globe className="w-5 h-5 text-gray-600" />
              )}
              <div>
                <h4 className="font-medium text-gray-900">
                  {formData.isPrivate ? 'Grupo Privado' : 'Grupo Público'}
                </h4>
                <p className="text-sm text-gray-600">
                  {formData.isPrivate
                    ? 'Solo miembros invitados pueden unirse'
                    : 'Cualquier estudiante puede encontrar y unirse'
                  }
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          </form>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 p-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="edit-group-form"
              disabled={loading || !formData.name.trim() || !formData.subject.trim() || !formData.university.trim() || !formData.career.trim() || !formData.semester.trim()}
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white transition flex items-center ${loading || !formData.name.trim() || !formData.subject.trim() || !formData.university.trim() || !formData.career.trim() || !formData.semester.trim()
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditGroupModal;
