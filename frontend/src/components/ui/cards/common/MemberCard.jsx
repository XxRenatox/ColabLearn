import React from "react";
import Avatar from "../../Avatar";
import { Crown, Shield, User } from "lucide-react";

export const MemberCard = ({ member, index, onAction, actionLabel, showActions = false }) => {
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return Crown;
      case 'moderator': return Shield;
      default: return User;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'moderator': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const RoleIcon = getRoleIcon(member.role);

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition">
      <div className="flex items-center">
        <Avatar
          userId={member.id || member.user_id || member.email || `member-${index}`}
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
        {member.role && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${getRoleColor(member.role)}`}>
            <RoleIcon className="w-3 h-3 mr-1" />
            {member.role === 'admin' ? 'Admin' : member.role === 'moderator' ? 'Moderador' : 'Miembro'}
          </span>
        )}
        {showActions && onAction && (
          <button
            onClick={() => onAction(member)}
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            {actionLabel || 'Acción'}
          </button>
        )}
      </div>
    </div>
  );
};

