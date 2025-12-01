import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

const MembersSidebar = ({ 
  groupMembers, 
  pendingMembers, 
  isAdmin, 
  isModerator, 
  onViewRequest,
  onViewAllMembers 
}) => {
  const [showMembersModal, setShowMembersModal] = useState(false);

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Miembros del Grupo */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="truncate">Miembros ({groupMembers.length})</span>
            </h3>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
            {groupMembers.length > 0 ? (
              <div className="space-y-3">
                {(groupMembers.length > 6 ? groupMembers.slice(0, 6) : groupMembers).map((member, index) => {
                  const memberStatus =
                    member.status === 'active'
                      ? { tone: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Activo' }
                      : member.status === 'inactive'
                        ? { tone: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Inactivo' }
                        : { tone: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Suspendido' };

                  const lastActivity = member.user?.last_active
                    ? (() => {
                        try {
                          const date = new Date(member.user.last_active);
                          if (isNaN(date.getTime())) return 'Sin registro';
                          const now = new Date();
                          const diffMs = now - date;
                          const diffMinutes = Math.floor(diffMs / (1000 * 60));
                          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                          
                          if (diffMinutes < 15) {
                            return '🟢';
                          } else if (diffMinutes < 60) {
                            return `${diffMinutes}m`;
                          } else if (diffHours < 24) {
                            return `${diffHours}h`;
                          } else {
                            return 'Off';
                          }
                        } catch (error) {
                          return '?';
                        }
                      })()
                    : '?';

                  return (
                    <motion.div
                      key={member.user_id || member.user?.id || index}
                      whileHover={{ translateY: -2 }}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100">
                          <Avatar
                            userId={member.user?.id || member.user?.email || `user-${member.user_id}`}
                            name={member.user?.name || 'Usuario'}
                            avatar={member.user?.avatar_url || null}
                            avatarStyle={member.user?.avatar}
                            size={10}
                            showBorder={false}
                          />
                        </div>
                      </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <p className="truncate text-xs sm:text-sm font-semibold text-gray-900">{member.user?.name || 'Usuario'}</p>
                              <span className="text-[10px] sm:text-xs flex-shrink-0">{lastActivity}</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                              <span className={`inline-flex items-center rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium ${memberStatus.tone}`}>
                                {memberStatus.label}
                              </span>
                              {(member.role === 'admin' || member.role === 'moderator') && (
                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-indigo-600">
                                  {member.role === 'admin' ? 'Admin' : 'Mod'}
                                </span>
                              )}
                            </div>
                          </div>
                    </motion.div>
                  );
                })}
                {groupMembers.length > 6 && (
                  <button
                    onClick={() => setShowMembersModal(true)}
                    className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-xs sm:text-sm"
                  >
                    Ver todos los miembros ({groupMembers.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aún no hay miembros registrados.</p>
              </div>
            )}
          </div>
        </div>

        {/* Solicitudes Pendientes (solo para admins/moderadores) */}
        {(isAdmin || isModerator) && (
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                <span className="truncate">Solicitudes</span>
                {pendingMembers.length > 0 && (
                  <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0">
                    {pendingMembers.length}
                  </span>
                )}
              </h3>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              {pendingMembers.length > 0 ? (
                <div className="space-y-3">
                  {pendingMembers.map((pendingMember) => {
                    const requestDate = pendingMember.joined_at
                      ? (() => {
                          try {
                            const date = new Date(pendingMember.joined_at);
                            if (isNaN(date.getTime())) return 'Fecha desconocida';
                            const now = new Date();
                            const diffMs = now - date;
                            const diffMinutes = Math.floor(diffMs / (1000 * 60));
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                            
                            if (diffMinutes < 1) {
                              return 'Ahora';
                            } else if (diffMinutes < 60) {
                              return `${diffMinutes}m`;
                            } else if (diffHours < 24) {
                              return `${diffHours}h`;
                            } else {
                              return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                            }
                          } catch (error) {
                            return '?';
                          }
                        })()
                      : '?';

                    return (
                      <motion.div
                        key={pendingMember.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-1.5 sm:gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 sm:p-3 hover:bg-amber-100 transition-colors cursor-pointer"
                        onClick={() => onViewRequest(pendingMember)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-amber-500 text-xs sm:text-sm font-semibold text-white flex-shrink-0">
                            {pendingMember.user?.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs sm:text-sm font-semibold text-gray-900">
                              {pendingMember.user?.name || 'Usuario'}
                            </p>
                            <p className="truncate text-[10px] sm:text-xs text-gray-500">
                              {pendingMember.user?.email || 'sin correo'}
                            </p>
                            <p className="text-[10px] sm:text-xs text-amber-600 mt-0.5 sm:mt-1">{requestDate}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewRequest(pendingMember);
                          }}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[10px] sm:text-xs font-semibold"
                        >
                          Ver y Decidir
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-[10px] sm:text-xs">No hay solicitudes pendientes.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Members Modal */}
      {showMembersModal && (
        <MembersModal
          members={groupMembers}
          onClose={() => setShowMembersModal(false)}
        />
      )}
    </>
  );
};

const MembersModal = ({ members, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Todos los Miembros ({members.length})
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member, index) => {
                const memberStatus =
                  member.status === 'active'
                    ? { tone: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Activo' }
                    : member.status === 'inactive'
                      ? { tone: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Inactivo' }
                      : { tone: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Suspendido' };

                const joinedLabel = member.joined_at
                  ? (() => {
                      try {
                        const date = new Date(member.joined_at);
                        if (isNaN(date.getTime())) return 'Fecha desconocida';
                        const now = new Date();
                        const diffMs = now - date;
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        
                        if (diffDays === 0) {
                          return `Hoy`;
                        } else if (diffDays === 1) {
                          return `Ayer`;
                        } else if (diffDays < 7) {
                          return date.toLocaleDateString('es-ES', { weekday: 'long' });
                        } else if (diffDays < 365) {
                          return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
                        } else {
                          return date.toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          });
                        }
                      } catch (error) {
                        return 'Fecha desconocida';
                      }
                    })()
                  : 'Fecha desconocida';

                const lastActivity = member.user?.last_active
                  ? (() => {
                      try {
                        const date = new Date(member.user.last_active);
                        if (isNaN(date.getTime())) return 'Sin registro';
                        const now = new Date();
                        const diffMs = now - date;
                        const diffMinutes = Math.floor(diffMs / (1000 * 60));
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        
                        if (diffMinutes < 15) {
                          return '🟢 En línea';
                        } else if (diffMinutes < 60) {
                          return `Hace ${diffMinutes} min`;
                        } else if (diffHours < 24) {
                          return `Hace ${diffHours}h`;
                        } else if (diffDays === 1) {
                          return `Ayer`;
                        } else if (diffDays < 7) {
                          return `Hace ${diffDays} días`;
                        } else {
                          return date.toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short' 
                          });
                        }
                      } catch (error) {
                        return 'Sin registro';
                      }
                    })()
                  : 'Sin registro';

                return (
                      <motion.div
                        key={member.user_id || member.user?.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ translateY: -4 }}
                        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold">
                        <Avatar
                          userId={member.user?.id || member.user?.email || `user-${member.user_id}`}
                          name={member.user?.name || 'Usuario'}
                          avatar={member.user?.avatar_url || null}
                          avatarStyle={member.user?.avatar}
                          size={12}
                          showBorder={false}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">{member.user?.name || 'Usuario'}</p>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${memberStatus.tone}`}>
                            {memberStatus.label}
                          </span>
                          {(member.role === 'admin' || member.role === 'moderator') && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                              {member.role === 'admin' ? 'Administrador' : 'Moderador'}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-gray-500">{member.user?.email || 'sin correo'}</p>
                      </div>
                    </div>

                        <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="font-medium text-gray-500">Última actividad</span>
                        <span className="text-gray-700">{lastActivity}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="font-medium text-gray-500">Miembro desde</span>
                        <span className="text-gray-700">{joinedLabel}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MembersSidebar;

