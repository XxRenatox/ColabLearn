import React, { useState, useEffect } from "react";
import Avatar from "../../ui/Avatar";
import {
  X,
  Users,
  BookOpen,
  MessageSquare,
  Calendar,
  MapPin,
  ChevronRight,
  GraduationCap,
  Book,
  Clock,
  Star,
  Shield,
  Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGroups } from "../../../hooks/useGroups";

export const GroupDetailModal = ({
  group,
  isMember,
  onClose,
  onJoin,
  onChat,
  loading,
}) => {
  const [groupDetails, setGroupDetails] = useState(group);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { getGroup } = useGroups();

  useEffect(() => {
    const loadGroupDetails = async () => {
      if (!group?.id) return;
      
      setLoadingDetails(true);
      try {
        // Llamar en modo silencioso para no mostrar errores si ya tenemos datos del grupo
        const response = await getGroup(group.id, true);
        setGroupDetails(response.data || response || group);
      } catch (error) {
        // Si falla, usar los datos del grupo que ya tenemos
        // No mostrar error porque ya tenemos información básica del grupo
        setGroupDetails(group);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadGroupDetails();
  }, [group]);

  if (!group) return null;
  const displayGroup = groupDetails || group;

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
          className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">{displayGroup.name}</h2>
              {displayGroup.active_sessions > 0 && (
                <p className="text-blue-100 text-sm mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {displayGroup.active_sessions} sesión{displayGroup.active_sessions > 1 ? 'es' : ''} activa{displayGroup.active_sessions > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            {loadingDetails && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {/* Info */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  displayGroup.is_private
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {displayGroup.is_private ? "Privado" : "Público"}
              </span>
              <span className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-1 text-gray-400" />
                {displayGroup.member_count} miembros
              </span>
              <span className="flex items-center text-sm text-gray-600">
                <BookOpen className="w-4 h-4 mr-1 text-gray-400" />
                {displayGroup.subject}
              </span>
              {displayGroup.average_rating && (
                <span className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" />
                  {displayGroup.average_rating.toFixed(1)}
                </span>
              )}
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              {displayGroup.description || "Este grupo no tiene descripción."}
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900">{displayGroup.member_count || 0}</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">Miembros</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-900">{displayGroup.session_count || 0}</span>
                </div>
                <p className="text-xs text-purple-700 mt-1">Sesiones</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <Star className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-900">{displayGroup.average_rating?.toFixed(1) || "N/A"}</span>
                </div>
                <p className="text-xs text-green-700 mt-1">Calificación</p>
              </div>
            </div>

            {/* Grid Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">DETALLES DEL GRUPO</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start">
                  <GraduationCap className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Universidad</p>
                    <p className="text-sm font-medium text-gray-900">{displayGroup.university || 'No especificado'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Book className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Carrera</p>
                    <p className="text-sm font-medium text-gray-900">{displayGroup.career || 'No especificado'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Semestre</p>
                    <p className="text-sm font-medium text-gray-900">{displayGroup.semester ? `${displayGroup.semester}°` : 'No especificado'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Ubicación</p>
                    <p className="text-sm font-medium text-gray-900">{displayGroup.location || 'No especificado'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Members */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-between">
                <span>Miembros del Grupo</span>
                <span className="text-sm font-normal text-gray-500">({displayGroup.member_count})</span>
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {displayGroup.members?.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition"
                  >
                    <div className="flex items-center">
                      <Avatar
                        userId={member.id || member.user_id || member.email || `member-${idx}`}
                        name={member.name || "Usuario"}
                        avatar={member.avatar_url || null}
                        avatarStyle={member.avatar}
                        size="md"
                        showBorder={true}
                        className="mr-3 shadow border-2 border-white"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name || "Usuario"}</p>
                        <p className="text-xs text-gray-500">
                          {member.email || "Miembro"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === 'admin' && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center">
                          <Crown className="w-3 h-3 mr-1" />
                          Admin
                        </span>
                      )}
                      {member.role === 'moderator' && (
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex items-center">
                          <Shield className="w-3 h-3 mr-1" />
                          Moderador
                        </span>
                      )}
                    </div>
                  </div>
                )) || displayGroup.members_preview?.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg px-3 py-2 shadow-sm"
                  >
                    <Avatar
                      userId={member.id || member.user_id || member.email || `member-${idx}`}
                      name={member.name || "Usuario"}
                      avatar={member.avatar_url || null}
                      avatarStyle={member.avatar}
                      size="sm"
                      showBorder={true}
                      className="mr-3 shadow-md border-2 border-white"
                    />
                    <span className="text-sm text-gray-800 font-medium">
                      {member.name}
                    </span>
                  </div>
                ))}
                {displayGroup.member_count > (displayGroup.members?.length || displayGroup.members_preview?.length || 0) && (
                  <div className="text-center py-2 text-sm text-gray-500 border-t border-gray-200">
                    +{displayGroup.member_count - (displayGroup.members?.length || displayGroup.members_preview?.length || 0)} miembros más
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 p-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white transition"
            >
              Cerrar
            </button>

            {!isMember ? (
              <button
                onClick={onJoin}
                disabled={loading}
                className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white transition ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Enviando..." : "Solicitar unirse"}
              </button>
            ) : (
              <button
                onClick={onChat}
                className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition"
              >
                Ir al chat del grupo
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const GroupMemberModal = ({ group, onClose, onChat, onManage }) => {
  if (!group) return null;

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
          className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">{group.name}</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            {/* Quick Actions */}
            <div className="space-y-3 mb-6">
              <button
                onClick={onChat}
                className="w-full p-4 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg text-left flex items-center justify-between hover:shadow-sm transition"
              >
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="font-medium text-gray-800">
                    Ir al chat del grupo
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={onManage}
                className="w-full p-4 bg-gradient-to-r from-green-50 to-white border border-green-100 rounded-lg text-left flex items-center justify-between hover:shadow-sm transition"
              >
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-green-600 mr-3" />
                  <span className="font-medium text-gray-800">
                    Gestionar miembros
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                INFORMACIÓN DEL GRUPO
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <BookOpen className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Materia</p>
                    <p className="text-sm text-gray-600">
                      {group.subject || "No especificada"}
                    </p>
                  </div>
                </div>
                {group.university && (
                  <div className="flex items-start">
                    <GraduationCap className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Universidad
                      </p>
                      <p className="text-sm text-gray-600">
                        {group.university}
                      </p>
                    </div>
                  </div>
                )}
                {group.career && (
                  <div className="flex items-start">
                    <Book className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Carrera
                      </p>
                      <p className="text-sm text-gray-600">{group.career}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Members */}
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
              MIEMBROS ({group.member_count})
            </h3>
            <div className="space-y-2">
              {group.members_preview?.map((member, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center">
                    <Avatar
                      userId={member.id || member.user_id || member.email || `member-${idx}`}
                      name={member.name || "Usuario"}
                      avatar={member.avatar || member.avatar_url}
                      size="md"
                      showBorder={true}
                      className="mr-3 border-2 border-white shadow-sm"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.name || "Usuario"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.role || "Miembro"}
                      </p>
                    </div>
                  </div>
                  {member.is_admin && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
