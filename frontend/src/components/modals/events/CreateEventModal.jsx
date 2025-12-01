import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Palette, Flag, BookOpen, Users } from 'lucide-react';
import { useGroups } from '../../../hooks/useGroups';
import { calendarAPI } from '../../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../ui/Toast';

const CreateEventModal = ({ isOpen, onClose, onEventCreated, userGroups = [] }) => {
  const { getGroups } = useGroups();
  const { addToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'reminder',
    start_date: '',
    end_date: '',
    all_day: false,
    timezone: 'America/Santiago',
    group_id: '',
    priority: 'medium',
    color: 'bg-blue-500',
    location: ''
  });

  const eventTypes = [
    { value: 'exam', label: 'Examen', icon: BookOpen },
    { value: 'assignment', label: 'Entrega', icon: BookOpen },
    { value: 'reminder', label: 'Recordatorio', icon: Calendar },
    { value: 'deadline', label: 'Fecha Límite', icon: Clock },
    { value: 'session', label: 'Sesión', icon: Users }
  ];

  const priorities = [
    { value: 'low', label: 'Baja', color: 'text-green-600' },
    { value: 'medium', label: 'Media', color: 'text-yellow-600' },
    { value: 'high', label: 'Alta', color: 'text-red-600' }
  ];

  const colors = [
    { value: 'bg-blue-500', label: 'Azul', color: 'bg-blue-500' },
    { value: 'bg-green-500', label: 'Verde', color: 'bg-green-500' },
    { value: 'bg-yellow-500', label: 'Amarillo', color: 'bg-yellow-500' },
    { value: 'bg-red-500', label: 'Rojo', color: 'bg-red-500' },
    { value: 'bg-purple-500', label: 'Morado', color: 'bg-purple-500' },
    { value: 'bg-pink-500', label: 'Rosa', color: 'bg-pink-500' }
  ];

  useEffect(() => {
    if (isOpen && userGroups.length > 0) {
      setGroups(userGroups);
    }
  }, [isOpen, userGroups]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        // Convertir fechas de hora local a ISO
        // new Date() interpreta el formato datetime-local como hora local del navegador
        // toISOString() lo convierte correctamente a UTC para almacenar en el servidor
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        all_day: formData.all_day,
        timezone: formData.timezone,
        priority: formData.priority,
        color: formData.color,
        location: formData.location,
        group_id: formData.group_id || null
      };

      const event = await calendarAPI.createEvent(eventData);
      if (onEventCreated) {
        onEventCreated(event);
      }

      onClose();
      resetForm();
      addToast('Evento creado exitosamente', 'success');
    } catch (error) {
      // Mostrar el error al usuario de forma amigable
      const errorMessage = error.response?.data?.message || error.message || 'No se pudo crear el evento';
      addToast('Error al crear evento', 'error');
      console.error('Error creando evento:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'reminder',
      start_date: '',
      end_date: '',
      all_day: false,
      timezone: 'America/Santiago',
      group_id: '',
      priority: 'medium',
      color: 'bg-blue-500',
      location: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Generar fecha mínima (ahora) usando hora local del cliente
  const getMinDateTime = () => {
    const now = new Date();
    
    // Formatear en hora local para datetime-local input (YYYY-MM-DDTHH:mm)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Crear Nuevo Evento</h2>
            <p className="text-gray-600 mt-1">Agrega un evento personal al calendario</p>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del Evento *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength={200}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Examen de Matemáticas"
              />
            </div>

            {/* Tipo de evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Evento
              </label>
              <select
                name="event_type"
                value={formData.event_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grupo (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grupo Asociado (Opcional)
              </label>
              <select
                name="group_id"
                value={formData.group_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin grupo específico</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} - {group.subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y hora de inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha y Hora de Inicio *
              </label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                min={getMinDateTime()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fecha y hora de fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Fecha y Hora de Fin *
              </label>
              <input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
                min={formData.start_date || getMinDateTime()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Todo el día */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="all_day"
              id="all_day"
              checked={formData.all_day}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="all_day" className="ml-2 text-sm text-gray-700">
              Todo el día
            </label>
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
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe el evento..."
            />
          </div>

          {/* Configuración adicional */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Configuración</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prioridad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Flag className="w-4 h-4 inline mr-1" />
                  Prioridad
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Color
                </label>
                <div className="flex space-x-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      className={`w-8 h-8 rounded-full ${color.color} border-2 ${
                        formData.color === color.value ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ubicación
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ubicación del evento (opcional)"
              />
            </div>
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
              disabled={!formData.title.trim() || !formData.start_date || !formData.end_date}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Crear Evento
            </button>
          </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateEventModal;
