import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MessageSquare, Loader } from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import { useSocket } from '../../../../contexts/SocketContext';
import GroupChat from './GroupChat';
import { useResources } from '../../../../hooks/useResources';
import { useToast } from '../../../ui/Toast';
import { groupsAPI, resourcesAPI } from '../../../../services/api';
import UploadResourceModal from '../../../modals/resources/UploadResourcesModal';
import MemberRequestModal from '../../../modals/groups/MemberRequestModal';
import InviteCodeBanner from './InviteCodeBanner';
import MembersSidebar from './MembersSidebar';
import ResourcesSection from './ResourcesSection';

const GroupDetailSection = ({ group, groupId, onBack }) => {
  const { user, loadGroups } = useApp();
  const { addToast } = useToast();
  const { getResourcesByGroup, downloadResource } = useResources();

  const [currentGroup, setCurrentGroup] = useState(group || null);
  const [isLoading, setIsLoading] = useState(!group);
  const [groupResources, setGroupResources] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  // Socket.IO hooks
  const { joinGroup, leaveGroup } = useSocket();
  
  const lastLoadedIdRef = useRef(null);

  // Check user membership with better error handling
  const { isAdmin: userIsAdmin } = useApp();
  
  // Helper para extraer datos
  const extractData = (response) => {
    if (!response || typeof response !== 'object') return response;
    if (response.data !== undefined) return response.data;
    if (response.success && response.data !== undefined) return response.data;
    return response;
  };

  const normalizeMembers = (members) => {
    if (!Array.isArray(members)) return [];
    return members.map((member) => {
      const userId = member.user_id || member.userId || member.user?.id || member.user?.user_id || null;
      return {
        ...member,
        user_id: userId,
        user: member.user || member.user_data || null,
      };
    });
  };

  const normalizedMembers = normalizeMembers(currentGroup?.members);
  const currentMember = normalizedMembers.find((m) => (m.user_id || m.user?.id) === user?.id) || null;
  const isAdmin = Boolean(userIsAdmin || currentMember?.role === 'admin');
  const isModerator = Boolean(currentMember?.role === 'moderator' || isAdmin);
  const isMember = Boolean(currentMember) || isAdmin;
  

  // Cargar datos del grupo
  const loadAllGroupData = useCallback(async (targetGroupId, force = false) => {
    if (!targetGroupId || (!force && lastLoadedIdRef.current === targetGroupId)) {
      return;
    }

    try {
      setIsLoading(true);
      if (force) {
        lastLoadedIdRef.current = null; // Forzar recarga
      }
      lastLoadedIdRef.current = targetGroupId;
      
      const [groupRes, resourcesRes] = await Promise.all([
        groupsAPI.getGroup(targetGroupId),
        resourcesAPI.getResources({ groupId: targetGroupId }),
      ]);

      const groupPayload = extractData(groupRes);
      const groupData = groupPayload?.group || groupPayload || {};
      
      // Asegurarse de que los miembros siempre sean un array
      const members = normalizeMembers(groupData.members);
      
      // Calcular si el usuario es admin o moderador DESPUÉS de cargar los miembros
      const currentUserMember = members.find((m) => (m.user_id || m.user?.id) === user?.id) || null;
      const userIsAdminInGroup = Boolean(userIsAdmin || currentUserMember?.role === 'admin');
      const userIsModeratorInGroup = Boolean(currentUserMember?.role === 'moderator' || userIsAdminInGroup);
      
      const currentUserIsMember = Boolean(
        user && members.some((m) => (m.user_id || m.user?.id) === user.id)
      );
      
      // Actualizar el estado del grupo
      setCurrentGroup(prev => ({
        ...prev,
        ...groupData,
        members
      }));
      
      // Actualizar la lista de miembros
      setGroupMembers(members);

      const resourcesPayload = extractData(resourcesRes);
      const allResources = resourcesPayload?.resources || resourcesPayload || [];
      
      // Filtrar solo los recursos que pertenecen a este grupo específico Y son públicos
      const groupResourcesFiltered = Array.isArray(allResources)
        ? allResources.filter(resource => {
            const resourceGroupId = resource.group_id || resource.group?.id || resource.group_id;
            const isPublic = resource.is_public === true;
            return resourceGroupId === targetGroupId && isPublic;
          })
        : [];
      
      setGroupResources(prevResources => {
        return JSON.stringify(prevResources) === JSON.stringify(groupResourcesFiltered)
          ? prevResources
          : groupResourcesFiltered;
      });

      // Cargar solicitudes pendientes si el usuario es admin o moderador
      if (userIsAdminInGroup || userIsModeratorInGroup) {
        try {
          const pendingRes = await groupsAPI.getPendingMembers(targetGroupId);
          const pendingPayload = extractData(pendingRes);
          const pendingData = pendingPayload?.pendingMembers || pendingPayload?.data?.pendingMembers || pendingPayload || [];
          console.log('[GroupDetailSection] Solicitudes pendientes cargadas:', pendingData);
          setPendingMembers(Array.isArray(pendingData) ? pendingData : []);
        } catch (err) {
          console.error('[GroupDetailSection] Error cargando solicitudes pendientes:', err);
          // Si no tiene permisos o no hay solicitudes, simplemente no mostrar nada
          setPendingMembers([]);
        }
      } else {
        setPendingMembers([]);
      }

      // Join group chat cuando el usuario tiene acceso
      if (groupData.id && (userIsAdmin || currentUserIsMember)) {
        joinGroup(groupData.id);
      } else if (groupData.id) {
        leaveGroup(groupData.id);
      }
      
    } catch (err) {
      addToast('Error al cargar los datos del grupo', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, joinGroup, leaveGroup, user?.id, userIsAdmin]);

  // Efecto para cargar datos del grupo
  useEffect(() => {
    const targetId = groupId || group?.id;
    if (targetId) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        loadAllGroupData(targetId);
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }
  }, [groupId, group?.id, loadAllGroupData]);

  // Clean up when component unmounts or group changes
  useEffect(() => {
    return () => {
      if (currentGroup?.id) {
        leaveGroup(currentGroup.id);
      }
    };
  }, [currentGroup?.id, leaveGroup]);



  const handleApproveMember = async (memberId) => {
    try {
      const response = await groupsAPI.approveMember(currentGroup.id, memberId);
      
      // apiRequest devuelve response.data directamente, que contiene { success, message }
      addToast(
        response?.message || 'Solicitud aprobada exitosamente', 
        'success'
      );
      
      // Recargar datos del grupo automáticamente (forzar recarga)
      await loadAllGroupData(currentGroup.id, true);
      
      // Recargar grupos en AppContext para actualizar cards en otras secciones
      if (loadGroups) {
        await loadGroups();
      }
      
      setShowRequestModal(false);
      setSelectedRequest(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al aprobar la solicitud';
      addToast(errorMessage, 'error');
    }
  };

  const handleRejectMember = async (memberId) => {
    try {
      const response = await groupsAPI.rejectMember(currentGroup.id, memberId);
      
      // apiRequest devuelve response.data directamente, que contiene { success, message }
      addToast(
        response?.message || 'Solicitud rechazada exitosamente', 
        'success'
      );
      
      // Recargar datos del grupo automáticamente (forzar recarga)
      await loadAllGroupData(currentGroup.id, true);
      
      // Recargar grupos en AppContext para actualizar cards en otras secciones
      if (loadGroups) {
        await loadGroups();
      }
      
      setShowRequestModal(false);
      setSelectedRequest(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al rechazar la solicitud';
      addToast(errorMessage, 'error');
    }
  };

  const handleViewRequest = (pendingMember) => {
    setSelectedRequest(pendingMember);
    setShowRequestModal(true);
  };

  const handleDownloadResource = async (resourceId) => {
    try {
      await downloadResource(resourceId);
      await loadAllGroupData(currentGroup.id, true);
    } catch (error) {
      addToast('Error al descargar el recurso', 'error');
    }
  };

  const handleViewResource = (resourceId) => {
    addToast('Vista previa no disponible aún', 'info');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="animate-spin h-10 w-10 text-blue-600 mb-4" />
        <p className="text-gray-600 font-medium">Cargando grupo...</p>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>No se pudo cargar la información del grupo</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
        >
          <ChevronLeft className="w-5 h-5" /> Volver
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {currentGroup.name}
          </h2>
          {currentGroup.subject && (
            <p className="text-sm text-gray-600 mt-1">{currentGroup.subject}</p>
          )}
        </div>
        <div className="w-24" /> {/* Spacer para centrar */}
      </div>

      {/* Layout principal: Chat (izquierda) y Sidebar (derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat del Grupo - Columna izquierda (2/3) */}
        <div className="lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Chat del Grupo
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
            <GroupChat 
              groupId={currentGroup?.id}
              groupName={currentGroup?.name}
              isMember={isMember}
              groupMembers={groupMembers}
              isAdmin={isAdmin}
              isModerator={isModerator}
              currentUserId={user?.id}
            />
          </div>
        </div>

        {/* Sidebar Derecho: Banner, Miembros y Solicitudes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Banner del Código de Invitación */}
          <InviteCodeBanner group={currentGroup} />

          {/* Miembros y Solicitudes */}
          <MembersSidebar
            groupMembers={groupMembers}
            pendingMembers={pendingMembers}
            isAdmin={isAdmin}
            isModerator={isModerator}
            onViewRequest={handleViewRequest}
          />
        </div>
      </div>

      {/* Recursos del Grupo - Al final */}
      <div className="mt-8">
        <ResourcesSection
          resources={groupResources}
          isAdmin={isAdmin}
          isModerator={isModerator}
          onUpload={() => setShowUploadModal(true)}
          onDownload={async (resourceId) => {
            try {
              await downloadResource(resourceId);
              await loadAllGroupData(currentGroup.id, true);
            } catch (error) {
              addToast('Error al descargar el recurso', 'error');
            }
          }}
          onView={handleViewResource}
        />
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadResourceModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUpload={() => addToast('Recurso subido correctamente', 'success')}
            groupId={currentGroup.id}
          />
        )}
      </AnimatePresence>
      {/* Member Request Modal */}
      {showRequestModal && selectedRequest && (
        <MemberRequestModal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedRequest(null);
          }}
          pendingMember={selectedRequest}
          groupId={currentGroup.id}
          onApproved={handleApproveMember}
          onRejected={handleRejectMember}
        />
      )}

    </motion.div>
  );
};

export default GroupDetailSection;
