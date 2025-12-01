import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGroups } from "../../../../hooks/useGroups";
import { useToast } from "../../Toast";
import {
  Star,
  Users,
  Clock,
  Calendar,
  Eye,
  UserPlus,
  Settings,
  Lock,
  Globe
} from "lucide-react";
import { GroupDetailModal } from "../../../modals/groups/GroupDetailModal";
import EditGroupModal from "../../../modals/groups/EditGroupModal";

export const GroupCard = ({ group, onView, onJoin, className = '', onGroupUpdated }) => {
  const navigate = useNavigate();
  const { joinGroup, loading: groupActionLoading } = useGroups();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(group);
  const [joiningGroup, setJoiningGroup] = useState(false);

  useEffect(() => {
    setCurrentGroup(group);
  }, [group]);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'moderator': return 'bg-orange-100 text-orange-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewClick = (e) => {
    e.stopPropagation();
    if (onView) {
      onView(group);
    } else {
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSettingsClick = (e) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleGroupUpdatedFromEdit = async (updatedGroup) => {
    const groupData = updatedGroup?.data?.group || updatedGroup?.group || updatedGroup;
    
    if (groupData) {
      setCurrentGroup(prev => ({
        ...prev,
        ...groupData,
        require_approval: groupData.require_approval !== undefined ? groupData.require_approval : prev.require_approval,
        is_private: groupData.is_private !== undefined ? groupData.is_private : prev.is_private,
        allow_invites: groupData.allow_invites !== undefined ? groupData.allow_invites : prev.allow_invites,
      }));
    }
    
    setShowEditModal(false);
    
    if (onGroupUpdated) {
      const groupId = groupData?.id || updatedGroup?.id || currentGroup.id;
      onGroupUpdated(groupId, groupData || updatedGroup);
    }
  };

  const handleJoinClick = async (e) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin(group);
      return;
    }
    
    try {
      setJoiningGroup(true);
      const response = await joinGroup(currentGroup.id);
      const responseData = response?.data || response;
      const joinedDirectly = responseData?.is_member || responseData?.status === 'active' || false;
      const isPending = responseData?.is_pending || responseData?.status === 'pending' || false;
      
      addToast(
        joinedDirectly
          ? "Te has unido al grupo exitosamente"
          : "Tu solicitud ha sido enviada. El administrador del grupo revisará tu solicitud y te notificará cuando sea aprobada.", 
        "success"
      );
      
      setCurrentGroup((prev) => ({ 
        ...prev, 
        is_member: joinedDirectly,
        is_pending: isPending
      }));
      
      if (onGroupUpdated) {
        onGroupUpdated(currentGroup.id, { 
          is_member: joinedDirectly,
          is_pending: isPending
        });
      }
    } catch (error) {
      addToast(
        error.response?.data?.message ||
          error.message ||
          "Error al unirse al grupo",
        "error"
      );
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleJoinFromModal = async () => {
    await handleJoinClick({ stopPropagation: () => {} });
  };

  const handleChatFromModal = () => {
    navigate({ pathname: '/user/panel', search: `?group=${currentGroup.id}` });
    handleCloseModal();
  };

  return (
    <>
    <motion.div 
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col h-full group ${className}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header con gradiente sutil */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border-b border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg mb-1.5 break-words line-clamp-2 leading-tight">
              {currentGroup.name}
            </h3>
            {currentGroup.subject && (
              <p className="text-sm text-gray-600 line-clamp-1">{currentGroup.subject}</p>
            )}
          </div>
          {currentGroup.userRole === 'admin' && (
            <button 
              onClick={handleSettingsClick}
              className="flex-shrink-0 ml-2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
              title="Configuración del grupo"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(currentGroup.status)}`}>
            {currentGroup.status === 'active' ? 'Activo' : 
             currentGroup.status === 'inactive' ? 'Inactivo' : 
             currentGroup.status === 'archived' ? 'Archivado' : currentGroup.status}
          </span>
          {currentGroup.is_private ? (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Privado
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Público
            </span>
          )}
          {currentGroup.userRole && (
            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full items-center gap-1 ${getRoleColor(currentGroup.userRole)}`}>
              {currentGroup.userRole === 'admin' ? 'Admin' :
               currentGroup.userRole === 'moderator' ? 'Mod' : 'Miembro'}
            </span>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Métricas en grid mejorado */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <Users className="w-5 h-5 mx-auto mb-1.5 text-blue-600" />
            <div className="text-lg font-bold text-gray-900">{currentGroup.member_count || 0}</div>
            <div className="text-xs text-gray-600">de {currentGroup.max_members || 0} miembros</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1.5 text-purple-600" />
            <div className="text-lg font-bold text-gray-900">{currentGroup.total_sessions || 0}</div>
            <div className="text-xs text-gray-600">sesiones</div>
          </div>
          
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1.5 text-emerald-600" />
            <div className="text-lg font-bold text-gray-900">{currentGroup.total_hours || 0}h</div>
            <div className="text-xs text-gray-600">estudio</div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <Star className="w-5 h-5 mx-auto mb-1.5 text-amber-600 fill-amber-600" />
            <div className="text-lg font-bold text-gray-900">
              {currentGroup.average_rating ? currentGroup.average_rating.toFixed(1) : '0.0'}
            </div>
            <div className="text-xs text-gray-600">rating</div>
          </div>
        </div>

        {/* Información adicional */}
        {(currentGroup.university || currentGroup.career || currentGroup.semester) && (
          <div className="mb-4 space-y-1.5">
            {currentGroup.university && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="truncate">{currentGroup.university}</span>
              </div>
            )}
            {currentGroup.career && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                <span className="truncate">{currentGroup.career}</span>
              </div>
            )}
            {currentGroup.semester && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span>Semestre {currentGroup.semester}</span>
              </div>
            )}
          </div>
        )}

        {/* Barra de progreso si existe */}
        {currentGroup.progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
              <span className="font-medium">Progreso</span>
              <span className="font-semibold">{currentGroup.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentGroup.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
          <button 
            onClick={handleViewClick}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
          >
            <Eye className="w-4 h-4" />
            Ver Detalles
          </button>
          
          {onJoin && !currentGroup.is_member && !currentGroup.is_pending && (
            <button 
              onClick={handleJoinClick}
              disabled={groupActionLoading || joiningGroup}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {groupActionLoading || joiningGroup ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Uniendo...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{currentGroup.is_private || currentGroup.require_approval ? 'Solicitar' : 'Unirse'}</span>
                </>
              )}
            </button>
          )}
          {currentGroup.is_pending && (
            <span className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-amber-300 text-sm font-semibold rounded-lg text-amber-700 bg-amber-50">
              <Clock className="w-4 h-4" />
              Pendiente
            </span>
          )}
        </div>
      </div>
    </motion.div>
    {showModal && (
      <GroupDetailModal
        group={currentGroup}
        isMember={Boolean(currentGroup.is_member)}
        onClose={handleCloseModal}
        onJoin={handleJoinFromModal}
        onChat={handleChatFromModal}
        loading={joiningGroup}
      />
    )}
    {showEditModal && currentGroup && (
      <EditGroupModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onGroupUpdated={handleGroupUpdatedFromEdit}
        group={currentGroup}
      />
    )}
    </>
  );
};

