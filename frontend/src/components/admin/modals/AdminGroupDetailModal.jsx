import React from 'react';
import { X, MessageSquare, Users } from 'lucide-react';
import GroupChat from '@/components/ui/dashboard/shared/GroupChat';
import Avatar from '@/components/ui/Avatar';
import { formatDateTime } from '@/utils/adminUtils';

export const AdminGroupDetailModal = ({
  group,
  activeTab,
  onTabChange,
  members,
  loadingMembers,
  onClose,
}) => {
  if (!group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{group.name}</h2>
            <p className="text-sm text-gray-500">{group.subject || 'Sin asignatura'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </div>
          </button>
          <button
            onClick={() => onTabChange('members')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Miembros ({group.member_count || 0})
            </div>
          </button>
        </div>

        {/* Contenido de las pestañas */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' ? (
            <GroupChat
              groupId={group.id}
              groupName={group.name}
              isMember={true} // Los admins tienen acceso a todos los grupos
            />
          ) : (
            <div className="h-full overflow-y-auto p-4">
              {loadingMembers ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Cargando miembros...</p>
                  </div>
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Users className="w-12 h-12 mb-3 text-gray-400" />
                  <p className="font-medium">No hay miembros en este grupo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Avatar
                        userId={member.user?.id || member.user?.email || 'user'}
                        name={member.user?.name || 'Usuario'}
                        avatar={member.user?.avatar_url || null}
                        avatarStyle={member.user?.avatar || member.user?.avatar_style || 'circle'}
                        size="md"
                        showBorder={false}
                        className="w-10 h-10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {member.user?.name || 'Usuario sin nombre'}
                          </h4>
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                              member.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : member.role === 'moderator'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {member.role === 'admin'
                              ? 'Administrador'
                              : member.role === 'moderator'
                              ? 'Moderador'
                              : 'Miembro'}
                          </span>
                          {member.user?.is_active === false && (
                            <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {member.user?.email && (
                            <span className="truncate">{member.user.email}</span>
                          )}
                          {member.user?.university && (
                            <span className="truncate">{member.user.university}</span>
                          )}
                          {member.user?.career && (
                            <span className="truncate">{member.user.career}</span>
                          )}
                        </div>
                        {member.user?.level && (
                          <div className="mt-1 text-xs text-gray-400">
                            Nivel {member.user.level} • {member.user.total_sessions || 0} sesiones
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDateTime(member.joined_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGroupDetailModal;

