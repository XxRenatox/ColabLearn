import React from "react";
import { Check, Trash2, Eye, EyeOff } from "lucide-react";

export const NotificationCard = ({ 
  notification, 
  getNotificationIcon, 
  getNotificationColor,
  onMarkAsRead,
  onDelete,
  onToggleRead
}) => {
  const Icon = getNotificationIcon ? getNotificationIcon(notification.type) : null;
  const colorClasses = getNotificationColor ? getNotificationColor(notification.type) : 'text-gray-500 bg-gray-50';

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        notification.is_read
          ? 'bg-gray-50 border-gray-200 opacity-75'
          : 'bg-white border-blue-200 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {Icon && (
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold mb-1 ${
              notification.is_read ? 'text-gray-600' : 'text-gray-900'
            }`}>
              {notification.title}
            </h4>
            <p className={`text-sm mb-2 ${
              notification.is_read ? 'text-gray-500' : 'text-gray-700'
            }`}>
              {notification.message}
            </p>
            {notification.created_at && (
              <p className="text-xs text-gray-400">
                {new Date(notification.created_at).toLocaleString("es-ES", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {onToggleRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleRead(notification.id);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title={notification.is_read ? "Marcar como no leída" : "Marcar como leída"}
            >
              {notification.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {!notification.is_read && onMarkAsRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Marcar como leída"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

