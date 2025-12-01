import React from "react";
import { MessageSquare, Users, Clock, Lock, Globe } from "lucide-react";
import Avatar from "../../Avatar";

export const ForumCard = ({ forum, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Avatar
            userId={forum.creator?.id || forum.creator?.email || `forum-${forum.id}`}
            name={forum.creator?.name || 'Creador'}
            avatar={forum.creator?.avatar_url || null}
            avatarStyle={forum.creator?.avatar}
            size={12}
            showBorder={false}
            className="bg-blue-100 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm">
              {forum.title}
            </h3>
            <p className="text-xs text-gray-600 truncate">
              {forum.creator?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {forum.is_public ? (
            <Globe className="w-4 h-4 text-green-500" title="Público" />
          ) : (
            <Lock className="w-4 h-4 text-gray-400" title="Privado" />
          )}
          {forum.is_locked && (
            <Lock className="w-4 h-4 text-red-500" title="Bloqueado" />
          )}
        </div>
      </div>

      {forum.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {forum.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <MessageSquare className="w-4 h-4" />
            <span>{forum.total_posts || 0} posts</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{forum.total_replies || 0} respuestas</span>
          </div>
        </div>
        {forum.last_activity && (
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>
              {new Date(forum.last_activity).toLocaleDateString("es-ES")}
            </span>
          </div>
        )}
      </div>

      {forum.group && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Grupo:</span>
          <span className="text-xs font-medium text-gray-700 ml-2">
            {forum.group.name}
          </span>
        </div>
      )}
    </div>
  );
};

