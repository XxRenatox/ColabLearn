import React, { useState } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  Star,
  Settings,
  MessageCircle,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../../contexts/AppContext";
import { useGroups } from "../../../../hooks/useGroups";
import { useToast } from "../../../ui/Toast";
import CreateGroupModal from "../../../modals/groups/CreateGroupModal";
import DeleteGroupModal from "../../../modals/groups/DeleteGroupModal";
import GroupDetailSection from "../shared/GroupDetailSection";
import { GroupCard } from "../../../ui/Card";
import { useNavigate } from "react-router-dom";

function Groups({ studyGroups = [] }) {
  const { groups = [], loadGroups } = useApp();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const toastContext = useToast();
  const addToast = toastContext?.addToast || (() => {});

  const groupsToShow = (studyGroups && studyGroups.length > 0) ? studyGroups : (groups || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredGroups = groupsToShow.filter(group => {
    const matchesSearch = group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || group.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Funciones auxiliares
  const handleEditGroup = (groupId) => {
    // Usar el sistema de tabs y parámetros de búsqueda
    navigate({ pathname: '/user/panel', search: `?group=${groupId}` });
  };

  const handleDeleteGroup = (groupId) => {
    const group = groupsToShow.find(g => g.id === groupId);
    if (group) {
      setSelectedGroup(group);
      setShowDeleteModal(true);
    }
  };

  const handleGroupCreated = async () => {
    setShowCreateModal(false);
    addToast('¡Grupo creado exitosamente!', 'success');
    if (loadGroups) {
      await loadGroups();
    }
  };

  const handleGroupDeleted = async () => {
    setShowDeleteModal(false);
    setSelectedGroup(null);
    addToast('Grupo eliminado exitosamente', 'success');
    if (loadGroups) {
      await loadGroups();
    }
  };

  const handleGroupSettings = (groupId) => {
    // Por ahora mostrar el detalle del grupo (no hay página de settings separada)
    navigate({ pathname: '/user/panel', search: `?group=${groupId}` });
  };

  const handleGroupUpdated = (groupId, updates) => {
    // Esta función se llama cuando una card actualiza un grupo (ej: al unirse)
    // Podríamos actualizar el estado local si es necesario, pero AppContext maneja esto
    if (loadGroups) {
      loadGroups();
    }
  };

  const handleRefreshGroups = async () => {
    try {
      if (loadGroups) {
        await loadGroups();
        addToast('Grupos recargados exitosamente', 'success');
      }
    } catch (error) {
      addToast('Error al recargar grupos', 'error');
    }
  };

  const handleViewGroup = (group) => {
    // Create a new object to break the reference
    const groupCopy = {
      id: group.id,
      name: group.name,
      description: group.description,
      subject: group.subject,
      university: group.university,
      members: [...(group.members || [])]
    };
    setSelectedGroup(groupCopy);
    setViewMode('detail');
  };
  
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedGroup(null);
  };

  // Renderizar la vista de detalles del grupo
  if (viewMode === 'detail' && selectedGroup) {
    return (
      <div className="space-y-6">
        <GroupDetailSection 
          group={selectedGroup} 
          groupId={selectedGroup.id}
          onBack={handleBackToList}
          onEdit={handleEditGroup}
          onSettings={handleGroupSettings}
          onDelete={handleDeleteGroup}
        />
      </div>
    );
  }

  // Renderizar la lista de grupos
  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key="list"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleRefreshGroups}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="Recargar grupos"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recargar
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Grupo
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="completed">Completados</option>
            <option value="archived">Archivados</option>
          </select>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <GroupCard 
                group={group}
                onView={handleViewGroup}
                onGroupUpdated={handleGroupUpdated}
                className="w-full"
              />
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron grupos' : 'No tienes grupos de estudio'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda'
                : '¡Únete a un grupo existente o crea uno nuevo para empezar a estudiar!'}
            </p>
            {!searchTerm && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Grupo
                </button>
                <button 
                  onClick={() => navigate('/user/panel?tab=explorer')}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Grupos
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {showCreateModal && (
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {showDeleteModal && selectedGroup && (
        <DeleteGroupModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedGroup(null);
          }}
          onGroupDeleted={handleGroupDeleted}
          group={selectedGroup}
        />
      )}
      </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default Groups;
