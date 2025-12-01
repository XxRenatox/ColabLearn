import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, MapPin, Video } from 'lucide-react';
import { useSessions } from '../../../hooks/useSessions';
import { useGroups } from '../../../hooks/useGroups';
import { useResources } from '../../../hooks/useResources';

const CreateSessionModal = ({ isOpen, onClose, onSessionCreated, preselectedGroupId = null, availableGroups = [] }) => {
  const { createSession, loading } = useSessions();
  const { getGroups } = useGroups();
  const { getResources } = useResources();
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupResources, setGroupResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    group_id: preselectedGroupId || '',
    scheduled_date: '',
    duration: 60,
    type: 'study',
    location_type: 'virtual',
    location_details: '',
    location_room: '',
    platform: 'Google Meet',
    max_attendees: 20,
    agenda: [],
    resources: [], // Array of selected resource IDs
    additionalResources: [] // Additional manually added resources
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

  useEffect(() => {
    if (isOpen) {
      // Si hay grupos disponibles, usarlos; si no, intentar cargar desde el hook
      if (availableGroups.length > 0) {
        setGroups(availableGroups);
      } else {
        // Cargar grupos del usuario donde es admin o moderador
        loadUserGroups();
      }
    }
  }, [isOpen, availableGroups]);

  // Función para cargar grupos del usuario donde es admin o moderador
  const loadUserGroups = async () => {
    setLoadingGroups(true);
    try {
      const response = await getGroups({ public: false }); // Obtener grupos del usuario
      const userGroups = response?.groups || response?.data?.groups || response || [];
      // Filtrar solo grupos donde el usuario es admin o moderador
      const filteredGroups = userGroups.filter((g) => {
        const userRole = g.userRole || g.role || g.user_role;
        return ['admin', 'moderator'].includes(userRole);
      });
      setGroups(filteredGroups);
    } catch (error) {
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Función para cargar recursos del grupo seleccionado
  const loadGroupResources = async (groupId) => {
    if (!groupId) {
      setGroupResources([]);
      return;
    }

    setLoadingResources(true);
    try {
      const response = await getResources({ group_id: groupId });
      setGroupResources(response.data || []);
    } catch (error) {
      setGroupResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  // Cargar recursos cuando cambia el grupo
  useEffect(() => {
    if (formData.group_id) {
      loadGroupResources(formData.group_id);
    } else {
      setGroupResources([]);
    }
  }, [formData.group_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Crear sesión de estudio
    // El input datetime-local devuelve la fecha en hora local (formato: "YYYY-MM-DDTHH:mm")
    // Para preservar la hora exacta que el usuario seleccionó, enviamos la fecha
    // tratando la hora local como UTC (sin conversión de zona horaria)
    const localDateTime = formData.scheduled_date; // "YYYY-MM-DDTHH:mm"
    // Construir el ISO string directamente sin conversión de zona horaria
    const scheduledDateTime = `${localDateTime}:00.000Z`;

    // Construir objeto de datos limpio, solo con campos necesarios
    let sessionData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        group_id: formData.group_id,
        scheduled_date: scheduledDateTime,
        duration: parseInt(formData.duration),
        type: formData.type || 'study',
        location_type: formData.location_type || 'virtual',
        location_details: formData.location_details?.trim() || '',
        location_room: formData.location_room?.trim() || '',
        platform: formData.platform || 'Google Meet',
        max_attendees: parseInt(formData.max_attendees) || 20,
        agenda: Array.isArray(formData.agenda) ? formData.agenda : [],
        // Combinar recursos del grupo seleccionados y recursos adicionales
        resources: [
          ...(Array.isArray(formData.resources) ? formData.resources : []),
          ...(Array.isArray(formData.additionalResources) ? formData.additionalResources : [])
        ]
      };
      
    // Eliminar campos vacíos opcionales
    if (!sessionData.description) delete sessionData.description;
    if (!sessionData.location_details) delete sessionData.location_details;
    if (!sessionData.location_room) delete sessionData.location_room;
    if (sessionData.agenda.length === 0) delete sessionData.agenda;
    if (sessionData.resources.length === 0) delete sessionData.resources;

    // Log para debugging
    console.log('Enviando datos de sesión:', {
      ...sessionData,
      scheduled_date: scheduledDateTime
    });

    try {
      const session = await createSession(sessionData);
      
      // Notificar primero antes de cerrar el modal
      if (onSessionCreated) {
        onSessionCreated(session);
      }
      
      // Cerrar modal y resetear formulario
      onClose();
      resetForm();
    } catch (error) {
      // Error creating session - el error ya se maneja en useSessions
      // El error puede venir transformado por buildError, así que accedemos a diferentes propiedades
      console.error('Error creando sesión:', error);
      console.error('Datos enviados:', sessionData);
      console.error('Error completo:', {
        message: error.message,
        status: error.status,
        response: error.response,
        responseData: error.response?.data,
        errors: error.errors,
        original: error.original
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      group_id: preselectedGroupId || '',
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
    setAgendaInput('');
    setResourceInput('');
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

  // Generar fecha mínima (ahora + 30 minutos) usando hora local del cliente
  const getMinDateTime = () => {
    const now = new Date();
    // Agregar 30 minutos
    now.setMinutes(now.getMinutes() + 30);
    // Redondear a los minutos (eliminar segundos y milisegundos)
    now.setSeconds(0, 0);
    
    // Formatear en hora local para datetime-local input (YYYY-MM-DDTHH:mm)
    // Usar métodos get* que devuelven valores en hora local
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div>
            <h2 className="text-2xl font-bold">Crear Nueva Sesión</h2>
            <p className="text-blue-100 mt-1">Programa una sesión de estudio para tu grupo</p>
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
            {/* Título */}
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

            {/* Grupo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grupo *
              </label>
              {groups.length === 0 ? (
                <div className="w-full px-4 py-3 border border-yellow-300 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                  <p className="font-medium mb-1">No tienes grupos disponibles</p>
                  <p className="text-xs">Solo puedes crear sesiones en grupos donde eres administrador o moderador.</p>
                </div>
              ) : (
                <select
                  name="group_id"
                  value={formData.group_id}
                  onChange={handleInputChange}
                  required
                  disabled={!!preselectedGroupId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Seleccionar grupo...</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} - {group.subject}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Fecha y hora */}
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
                min={getMinDateTime()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Duración */}
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
              placeholder="Describe los objetivos y contenido de la sesión..."
            />
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Ubicación</h3>
              
              {/* Tipo de ubicación */}
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

              {/* Detalles de ubicación */}
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
                      placeholder="Se generará automáticamente si se deja vacío"
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

          {/* Máximo de asistentes */}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recursos de la Sesión
            </label>
              
              {/* Recursos del grupo */}
              {formData.group_id && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Recursos del Grupo {loadingResources && <span className="text-gray-500">(Cargando...)</span>}
                  </h4>
                  {groupResources.length > 0 ? (
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
                  ) : !loadingResources && (
                    <p className="text-sm text-gray-500 italic">No hay recursos disponibles en este grupo</p>
                  )}
                </div>
              )}

              {/* Recursos adicionales */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Recursos Adicionales
                </h4>
                <div className="space-y-2">
                  {formData.additionalResources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span>{resource}</span>
                      <button
                        type="button"
                        onClick={() => removeResource(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={resourceInput}
                      onChange={(e) => setResourceInput(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, addResource)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Agregar recurso adicional (enlace, documento, etc.)..."
                    />
                    <button
                      type="button"
                      onClick={addResource}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
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
              disabled={loading || !formData.title.trim() || !formData.group_id || !formData.scheduled_date || groups.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Crear Sesión
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;
