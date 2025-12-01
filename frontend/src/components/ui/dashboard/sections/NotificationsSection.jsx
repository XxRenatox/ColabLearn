import React, { useState } from 'react';
import { Bell, Check, Trash2, Eye, EyeOff, Filter, Users, Trophy, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import { notificationsAPI } from '../../../../services/api';
import { NotificationCard } from '../../../ui/cards/common/NotificationCard';

const NotificationsSection = ({ notifications = [], loading = false }) => {
  const { loadNotifications } = useApp();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, group_invite, session_reminder, achievement_unlock, system

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'group_invite': return Users;
      case 'session_reminder': return Clock;
      case 'achievement_unlock': return Trophy;
      case 'system': return Bell;
      default: return AlertCircle;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'group_invite': return 'text-blue-500 bg-blue-50';
      case 'session_reminder': return 'text-green-500 bg-green-50';
      case 'achievement_unlock': return 'text-yellow-500 bg-yellow-50';
      case 'system': return 'text-purple-500 bg-purple-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      // Error marking notification as read
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      loadNotifications();
    } catch (error) {
      // Error marking all notifications as read
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      loadNotifications();
    } catch (error) {
      // Error deleting notification
    }
  };

  const clearAll = async () => {
    try {
      await notificationsAPI.clearAll();
      loadNotifications();
    } catch (error) {
      // Error clearing all notifications
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.is_read) return false;
    if (filter === 'read' && !notification.is_read) return false;
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Todas las notificaciones leídas'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </button>
          )}
          
          <button
            onClick={clearAll}
            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar todas
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="unread">Sin leer</option>
              <option value="read">Leídas</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="group_invite">Invitaciones a grupos</option>
              <option value="session_reminder">Recordatorios de sesión</option>
              <option value="achievement_unlock">Logros desbloqueados</option>
              <option value="system">Sistema</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
            <p className="text-gray-500">
              {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No hay notificaciones para mostrar'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              getNotificationIcon={getNotificationIcon}
              getNotificationColor={getNotificationColor}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              onToggleRead={(id) => {
                if (notification.is_read) {
                  // Si está leída, no hacer nada por ahora
                  // En el futuro se podría implementar marcar como no leída
                } else {
                  markAsRead(id);
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsSection;
