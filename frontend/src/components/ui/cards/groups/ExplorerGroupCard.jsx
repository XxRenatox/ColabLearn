import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGroups } from "../../../../hooks/useGroups";
import { useToast } from "../../Toast";
import {
  BookOpen,
  Clock,
  Lock,
  Globe,
  Check,
  Eye,
  UserPlus,
} from "lucide-react";
import { GroupDetailModal } from "../../../modals/groups/GroupDetailModal";

export const ExplorerGroupCard = ({
  group,
  showJoinButton = false,
  onGroupUpdated,
  inviteCode = null
}) => {
  const { joinGroup, loading: groupActionLoading } = useGroups();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(group);
  const [joiningGroup, setJoiningGroup] = useState(false);

  const handleJoinGroup = async (e) => {
    e?.stopPropagation();
    try {
      setJoiningGroup(true);
      const response = await joinGroup(currentGroup.id, inviteCode || null);
      const data = response?.data || response;

      const joined = data?.is_member || data?.status === "active";
      const pending = data?.is_pending || data?.status === "pending";

      addToast(
        joined
          ? "Te has unido al grupo exitosamente"
          : "Solicitud enviada. Espera la aprobación del administrador.",
        "success"
      );

      setCurrentGroup((prev) => ({
        ...prev,
        is_member: joined,
        is_pending: pending
      }));

      onGroupUpdated?.(currentGroup.id, {
        is_member: joined,
        is_pending: pending
      });
    } catch (err) {
      addToast(
        err.response?.data?.message || "Error al unirse al grupo",
        "error"
      );
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleViewDetails = (e) => {
    e?.stopPropagation();
    setShowModal(true);
  };

  const handleChatFromModal = () => {
    navigate({ pathname: "/user/panel", search: `?group=${currentGroup.id}` });
    setShowModal(false);
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        onClick={handleViewDetails}
        className="relative flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
      >
        <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        <div className="flex flex-col flex-1 p-5">
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
            {currentGroup.name}
          </h3>

          <div className="flex justify-center flex-wrap gap-2 mb-3">
            {currentGroup.is_private ? (
              <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Privado
              </span>
            ) : (
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Público
              </span>
            )}
            {currentGroup.is_pending && (
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Pendiente
              </span>
            )}
            {currentGroup.is_member && !currentGroup.is_pending && (
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <Check className="w-3 h-3" /> Miembro
              </span>
            )}
          </div>

          <p className="text-sm text-gray-700 text-center line-clamp-3 mb-3">
            {currentGroup.description || "Sin descripción"}
          </p>

          <div className="flex justify-center flex-wrap gap-2 text-xs text-gray-600 mb-4">
            {currentGroup.subject && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {currentGroup.subject}
              </span>
            )}
            {currentGroup.university && (
              <>
                <span className="text-gray-400">•</span>
                <span>{currentGroup.university}</span>
              </>
            )}
          </div>

          <div className="flex justify-center flex-wrap gap-2 text-xs text-gray-600 mb-6">
            {currentGroup.career && (
              <span className="bg-gray-100 px-2 py-1 rounded-md">
                {currentGroup.career}
              </span>
            )}
            {currentGroup.semester && (
              <span className="bg-gray-100 px-2 py-1 rounded-md">
                Semestre {currentGroup.semester}
              </span>
            )}
          </div>

          <div className="mt-auto flex gap-2">
            <button
              onClick={handleViewDetails}
              className="flex-1 inline-flex items-center justify-center gap-1 text-sm border border-gray-300 text-gray-700 bg-white rounded-lg py-2 hover:bg-gray-50 transition"
            >
              <Eye className="w-4 h-4" /> Ver
            </button>

            {showJoinButton && !currentGroup.is_member && !currentGroup.is_pending && (
              <button
                onClick={handleJoinGroup}
                disabled={joiningGroup || groupActionLoading}
                className="flex-1 inline-flex items-center justify-center gap-1 text-sm rounded-lg py-2 bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joiningGroup || groupActionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    Uniendo...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {currentGroup.is_private ? "Solicitar" : "Unirse"}
                  </>
                )}
              </button>
            )}

            {currentGroup.is_pending && (
              <span className="flex-1 inline-flex items-center justify-center gap-1 text-sm rounded-lg py-2 bg-amber-100 text-amber-700 border border-amber-200">
                <Clock className="w-4 h-4" /> Pendiente
              </span>
            )}

            {currentGroup.is_member && !currentGroup.is_pending && (
              <span className="flex-1 inline-flex items-center justify-center gap-1 text-sm rounded-lg py-2 bg-green-100 text-green-700 border border-green-200">
                <Check className="w-4 h-4" /> Miembro
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {showModal && (
        <GroupDetailModal
          group={currentGroup}
          isMember={!!currentGroup.is_member}
          onClose={() => setShowModal(false)}
          onJoin={handleJoinGroup}
          onChat={handleChatFromModal}
          loading={joiningGroup}
        />
      )}
    </>
  );
};

