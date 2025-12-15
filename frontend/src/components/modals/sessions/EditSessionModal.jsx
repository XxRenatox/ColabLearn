import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, MapPin, Video } from 'lucide-react';
import { useSessions } from '../../../hooks/useSessions';
import { useResources } from '../../../hooks/useResources';
import { useToast } from '../../../components/ui/Toast';
import { api } from '@/services/api';
import { getAuthToken } from '@/services/tokenManager';

const EditSessionModal = ({ isOpen, onClose, session, onSessionUpdated }) => {
  const { updateSession, loading } = useSessions();
  const { getResources } = useResources();
  const { addToast } = useToast();
  const [groupResources, setGroupResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [initialResourceIds, setInitialResourceIds] = useState([]); // To track original resources for delta updates

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    duration: 60,
    type: 'study',
    location_type: 'virtual',
    location_details: '',
    location_room: '',
    platform: 'Google Meet',
    max_attendees: 20,
    agenda: [],
    resources: [],
    additionalResources: []
  });

  const [agendaInput, setAgendaInput] = useState('');
  const [resourceInput, setResourceInput] = useState('');

  const platforms = [
    'Google Meet',
    'Zoom',
    'Microsoft Teams',
    'Discord',
    'Jitsi Meet',
    'Otro'
  ];

  // Función helper para convertir fecha a formato datetime-local (hora local del cliente)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Cargar datos de la sesión cuando se abre el modal
  useEffect(() => {
    if (isOpen && session) {
      const scheduledDate = session.scheduled_date
        ? formatDateForInput(session.scheduled_date)
        : '';

      // Validar si se puede editar (antes de 1 hora de que empiece)
      const sessionDate = session.scheduled_date ? new Date(session.scheduled_date) : null;
      const now = new Date();
      const oneHourBefore = sessionDate ? new Date(sessionDate.getTime() - (60 * 60 * 1000)) : null;
      const canEdit = !sessionDate || now < oneHourBefore;


      const fetchSessionResources = async () => {
        try {
          const token = getAuthToken();
          const res = await api.get(`/sessions/${session.id}/resources`);
          if (res.data?.success) {
            const currentResources = res.data.data.resources || [];
            const resourceIds = currentResources.map(r => r.id);

            setInitialResourceIds(resourceIds); // Store initial state

            setFormData(prev => ({
              ...prev,
              resources: resourceIds
            }));
          }
        } catch (e) {
          console.error("Error fetching session resources:", e);
          // Fallback to session data if fetch fails
          setInitialResourceIds(Array.isArray(session.resources) ? session.resources.map(r => r.id || r) : []);
        }
      };

      if (session.id) {
        fetchSessionResources();
      }

      setFormData({
        title: session.title || '',
        description: session.description || '',
        scheduled_date: scheduledDate,
        duration: session.duration || 60,
        type: session.type || 'study',
        location_type: session.location_type || 'virtual',
        location_details: session.location_details || '',
        location_room: session.location_room || '',
        platform: session.platform || 'Google Meet',
        max_attendees: session.max_attendees || 20,
        agenda: Array.isArray(session.agenda) ? session.agenda : [],
        resources: Array.isArray(session.resources) ? session.resources.map(r => r.id || r) : [], // Initial, will be overwritten by fetch
        additionalResources: [],
        canEdit // Guardar si se puede editar
      });
    }
  }, [isOpen, session]);

  // Cargar recursos del grupo
  useEffect(() => {
    if (isOpen && session?.group_id) {
      loadGroupResources(session.group_id);
    }
  }, [isOpen, session?.group_id]);

  const loadGroupResources = async (groupId) => {
    if (!groupId) {
      setGroupResources([]);
      return;
    }

    setLoadingResources(true);
    try {
      const response = await getResources({ group_id: groupId });
      const resources = response?.data?.resources || response?.data || [];
      setGroupResources(resources);
    } catch (error) {
      setGroupResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que se puede editar (antes de 1 hora de que empiece)
    if (session && session.scheduled_date) {
      const sessionDate = new Date(session.scheduled_date);
      const now = new Date();
      const oneHourBefore = new Date(sessionDate.getTime() - (60 * 60 * 1000));

      if (now >= oneHourBefore) {
        addToast('No puedes editar esta sesión. Solo puedes hacer cambios hasta 1 hora antes de que comience la sesión.', 'warning');
        return;
      }
    }

    try {
      // El input datetime-local devuelve la fecha en hora local (formato: "YYYY-MM-DDTHH:mm")
      // Para preservar la hora exacta que el usuario seleccionó, enviamos la fecha
      // tratando la hora local como UTC (sin conversión de zona horaria)
      const localDateTime = formData.scheduled_date; // "YYYY-MM-DDTHH:mm"
      const scheduledDateTime = `${localDateTime}:00.000Z`;

      // Calculate all resources first
      const allResources = [
        ...formData.resources,
        ...formData.additionalResources
      ];

      // Handle Resource Delta Updates (Link/Unlink)
      // 1. Identify added resources
      const addedResources = allResources.filter(id => !initialResourceIds.includes(id));

      // 2. Identify removed resources
      const removedResources = initialResourceIds.filter(id => !allResources.includes(id));

      // 3. Process changes concurrently but don't block
      const promises = [];
      const token = getAuthToken();

      // Link new resources
      for (const fileId of addedResources) {
        promises.push(
          api.post(`/sessions/${session.id}/resources/link`, { file_id: fileId })
            .catch(e => console.error(`Error linking resource ${fileId}:`, e))
        );
      }

      // Unlink removed resources
      for (const fileId of removedResources) {
        promises.push(
          api.delete(`/sessions/${session.id}/resources/${fileId}`)
            .catch(e => console.error(`Error unlinking resource ${fileId}:`, e))
        );
      }

      // Execute resource updates
      await Promise.allSettled(promises);

      const sessionData = {
        ...formData,
        scheduled_date: scheduledDateTime,
        duration: parseInt(formData.duration),
        max_attendees: parseInt(formData.max_attendees),
        resources: allResources // Send snapshot for legacy compatibility
      };

      // Eliminar campos que no deben enviarse
      delete sessionData.canEdit;
      delete sessionData.additionalResources;

      const updatedSession = await updateSession(session.id, sessionData);
      if (onSessionUpdated) {
        onSessionUpdated(updatedSession);
      }

      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addAgendaItem = () => {
    if (agendaInput.trim()) {
      setFormData(prev => ({
        ...prev,
        agenda: [...prev.agenda, agendaInput.trim()]
      }));
      setAgendaInput('');
    }
  };

  const removeAgendaItem = (index) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index)
    }));
  };

  const toggleGroupResource = (resourceId) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.includes(resourceId)
        ? prev.resources.filter(id => id !== resourceId)
        : [...prev.resources, resourceId]
    }));
  };

  const addResource = () => {
    if (resourceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalResources: [...prev.additionalResources, resourceInput.trim()]
      }));
      setResourceInput('');
    }
  };

  const removeResource = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalResources: prev.additionalResources.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div>
            <h2 className="text-2xl font-bold">Editar Sesión</h2>
            <p className="text-blue-100 mt-1">Modifica los detalles de la sesión</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título de la Sesión *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength={200}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Repaso de Derivadas e Integrales"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha y Hora *
              </label>
              <input
                type="datetime-local"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duración (minutos)
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1.5 horas</option>
                <option value={120}>2 horas</option>
                <option value={180}>3 horas</option>
              </select>
            </div>
          </div>

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
              placeholder="Describe los objetivos y contenido de la sesión..."
            />
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Ubicación</h3>

            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="location_type"
                  value="virtual"
                  checked={formData.location_type === 'virtual'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <Video className="w-4 h-4 mr-1" />
                Virtual
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="location_type"
                  value="physical"
                  checked={formData.location_type === 'physical'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <MapPin className="w-4 h-4 mr-1" />
                Presencial
              </label>
            </div>

            {formData.location_type === 'virtual' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plataforma
                  </label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enlace/ID de Reunión
                  </label>
                  <input
                    type="text"
                    name="location_details"
                    value={formData.location_details}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enlace de la videollamada"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="location_details"
                    value={formData.location_details}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Biblioteca Central"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sala/Aula
                  </label>
                  <input
                    type="text"
                    name="location_room"
                    value={formData.location_room}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Sala 301"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Máximo de Asistentes
            </label>
            <input
              type="number"
              name="max_attendees"
              value={formData.max_attendees}
              onChange={handleInputChange}
              min={2}
              max={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Agenda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agenda
            </label>
            <div className="space-y-2">
              {formData.agenda.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeAgendaItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={agendaInput}
                  onChange={(e) => setAgendaInput(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, addAgendaItem)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agregar punto de agenda..."
                />
                <button
                  type="button"
                  onClick={addAgendaItem}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Recursos */}
          {session.group_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recursos de la Sesión
              </label>

              {loadingResources ? (
                <p className="text-sm text-gray-500">Cargando recursos...</p>
              ) : groupResources.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {groupResources.map((resource) => (
                    <label key={resource.id} className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.resources.includes(resource.id)}
                        onChange={() => toggleGroupResource(resource.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {resource.name || resource.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {resource.type || resource.resource_type}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No hay recursos disponibles en este grupo</p>
              )}
            </div>
          )}

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
              disabled={loading || !formData.title.trim() || !formData.scheduled_date}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSessionModal;

