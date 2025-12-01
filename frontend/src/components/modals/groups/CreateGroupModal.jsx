import React, { useState } from 'react';
import { X, Users, BookOpen, Globe, Lock } from 'lucide-react';
import { useGroups } from '../../../hooks/useGroups';
import { motion, AnimatePresence } from 'framer-motion';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { createGroup, loading } = useGroups();
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
        is_private: formData.isPrivate,
        allow_invites: formData.allowInvites,
        require_approval: formData.requireApproval,
        color: formData.color
      };
      
      const group = await createGroup(groupData);
      
      if (onGroupCreated) {
        onGroupCreated(group);
      }
      onClose();
      resetForm();
    } catch (error) {
      // Error creating group
    }
  };

  const resetForm = () => {
    setFormData({
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
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };


  if (!isOpen) return null;

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
          className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Crear Nuevo Grupo</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
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
                  checked={formData.requireApproval}
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

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.subject.trim() || !formData.university.trim() || !formData.career.trim() || !formData.semester.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Crear Grupo
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

export default CreateGroupModal;
