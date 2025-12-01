import React, { useState, useEffect } from 'react';
import Avatar from '../../ui/Avatar';
import {
  X, Users, Calendar, Clock, Star, FolderOpen, MessageCircle, Settings,
  BookOpen, FileText, Upload, UserPlus, Crown, Shield, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResources } from '../../../hooks/useResources';
import { useGroups } from '../../../hooks/useGroups';
import UploadResourceModal from '../resources/UploadResourcesModal';

const ViewGroupModal = ({
  isOpen,
  onClose,
  group,
  onEdit,
  onJoinGroup,
  onOpenChat,
  onSettings,
}) => {
  const [groupResources, setGroupResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [detailedGroup, setDetailedGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { getResources, downloadResource, uploadResource } = useResources();
  const { getGroup } = useGroups();

  if (!isOpen || !group) return null;

  const isAdmin = group.userRole === 'admin';
  const isModerator = group.userRole === 'moderator';
  const isMember = group.userRole === 'member';
  const canEdit = isAdmin || isModerator;

  // Cargar detalles del grupo
  useEffect(() => {
    if (isOpen && group?.id) {
      const loadGroupDetails = async () => {
        setLoadingGroup(true);
        try {
          const response = await getGroup(group.id);
          if (response?.data?.group) setDetailedGroup(response.data.group);
        } catch (error) {
          // Error loading group details
        } finally {
          setLoadingGroup(false);
        }
      };
      loadGroupDetails();
    }
  }, [isOpen, group?.id, getGroup]);

  // Cargar recursos del grupo
  useEffect(() => {
    if (isOpen && group?.id) {
      const loadGroupResources = async () => {
        setLoadingResources(true);
        try {
          const response = await getResources({ group_id: group.id, limit: 6 });
          if (response?.data?.resources) setGroupResources(response.data.resources);
        } catch (error) {
          // Error loading group resources
        } finally {
          setLoadingResources(false);
        }
      };
      loadGroupResources();
    }
  }, [isOpen, group?.id, getResources]);

  const currentGroup = detailedGroup || group;

  // Funciones auxiliares
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getRole = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrador', color: 'bg-purple-100 text-purple-800', icon: <Crown className="w-4 h-4 text-purple-600" /> };
      case 'moderator':
        return { label: 'Moderador', color: 'bg-orange-100 text-orange-800', icon: <Shield className="w-4 h-4 text-orange-600" /> };
      default:
        return { label: 'Miembro', color: 'bg-blue-100 text-blue-800', icon: <User className="w-4 h-4 text-blue-600" /> };
    }
  };

  // Subida de recursos
  const handleUploadResource = async (formData) => {
    try {
      await uploadResource(formData);
      setShowUploadModal(false);
      const response = await getResources({ group_id: currentGroup.id, limit: 6 });
      if (response?.data?.resources) setGroupResources(response.data.resources);
    } catch (error) {
      // Error uploading resource
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{currentGroup.name}</h2>
                    <p className="text-white/80 text-sm mt-1">
                      {currentGroup.subject} • {currentGroup.university}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {canEdit && (
                    <button
                      onClick={() => onSettings?.(currentGroup.id)}
                      className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      title="Configuración del grupo"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* TABS */}
              <div className="flex space-x-1 mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-1">
                {['overview', 'resources', 'members'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab === 'overview' && <span>Resumen</span>}
                    {tab === 'resources' && <span>Recursos</span>}
                    {tab === 'members' && <span>Miembros</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3">Descripción</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {currentGroup.description || 'Sin descripción disponible.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{currentGroup.member_count || 0}</div>
                      <div className="text-sm text-gray-600">Miembros</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{currentGroup.total_sessions || 0}</div>
                      <div className="text-sm text-gray-600">Sesiones</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">{currentGroup.total_hours || 0}h</div>
                      <div className="text-sm text-gray-600">Estudio</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-yellow-600">
                        {currentGroup.average_rating ? currentGroup.average_rating.toFixed(1) : '0.0'}
                      </div>
                      <div className="text-sm text-gray-600">Rating</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: RESOURCES */}
              {activeTab === 'resources' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Recursos del Grupo</h3>
                    {canEdit && (
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Subir
                      </button>
                    )}
                  </div>
                  {loadingResources ? (
                    <p className="text-gray-600 text-center py-10">Cargando recursos...</p>
                  ) : groupResources.length ? (
                    <div className="grid gap-4">
                      {groupResources.map((r) => (
                        <div key={r.id} className="bg-white border p-4 rounded-xl flex justify-between items-center hover:shadow-lg transition">
                          <div>
                            <p className="font-semibold text-gray-900">{r.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(r.size)}</p>
                          </div>
                          <button
                            onClick={() => downloadResource(r.id)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Descargar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600">No hay recursos</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB: MEMBERS */}
              {activeTab === 'members' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <h3 className="text-2xl font-bold text-gray-900">
                    Miembros ({currentGroup.member_count || 0}/{currentGroup.max_members || 0})
                  </h3>
                  {currentGroup.members?.length ? (
                    currentGroup.members.map((m, i) => {
                      const role = getRole(m.role);
                      return (
                        <div key={m.user_id || i} className="bg-white border p-4 rounded-xl flex justify-between items-center hover:shadow-md">
                          <div className="flex items-center space-x-4">
                            <Avatar
                              userId={m.user_id || m.user?.id || m.user?.email || `member-${i}`}
                              name={m.user?.name || "Usuario"}
                              avatar={m.user?.avatar || m.user?.avatar_url}
                              size="lg"
                              showBorder={false}
                            />
                            <div>
                              <p className="font-semibold text-gray-900">{m.user?.name || 'Usuario'}</p>
                              <p className="text-sm text-gray-500">
                                Desde {new Date(m.joined_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${role.color}`}>
                            {role.icon}
                            <span>{role.label}</span>
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600">No hay miembros registrados</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t border-gray-200 bg-gray-50 p-4 flex justify-end gap-3">
              {isMember || isAdmin || isModerator ? (
                <>
                  <button
                    onClick={() => {
                      onOpenChat?.(currentGroup.id);
                      onClose();
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Ir al Chat
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => onEdit?.(currentGroup)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => onJoinGroup?.(currentGroup.id)}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Unirse al Grupo
                </button>
              )}
            </div>

            {showUploadModal && (
              <UploadResourceModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleUploadResource}
                groupId={currentGroup.id}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ViewGroupModal;
