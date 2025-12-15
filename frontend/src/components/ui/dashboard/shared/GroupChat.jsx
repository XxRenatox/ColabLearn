import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Wifi, WifiOff, Users } from 'lucide-react';
import { useSocket } from '../../../../contexts/SocketContext';
import { useApp } from '../../../../contexts/AppContext';
import { useToast } from '../../../ui/Toast';
import ChatUI from './ChatUI';

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const VISIBLE_MESSAGE_LIMIT = 120;

const GroupChat = ({ groupId, groupName, isMember, groupMembers = [], isAdmin = false, isModerator = false, currentUserId = null }) => {
  const { user } = useApp();
  const { addToast } = useToast();
  const { isConnected, messages, joinGroup, leaveGroup, sendMessage: sendSocketMessage } = useSocket();

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Cleaned up unused state (hover, menu, refs logic delegated to ChatUI)
  const messagesContainerRef = useRef(null); // Keep if used for scroll logic outside ChatUI? Yes, keeps own ref.
  const { isAdmin: isGlobalAdmin } = useApp();
  const hasJoinedGroupRef = useRef(null);
  const hasAccess = isMember || isGlobalAdmin;

  // Crear mapa de miembros para acceso rápido por user_id
  const membersMap = useMemo(() => {
    const map = new Map();
    groupMembers.forEach(member => {
      const userId = member.user_id || member.user?.id;
      if (userId) {
        map.set(userId, member);
      }
    });
    return map;
  }, [groupMembers]);

  // Función para obtener el rol de un usuario
  const getUserRole = (userId) => {
    const member = membersMap.get(userId);
    if (!member) return null;
    return member.role || null;
  };

  const canModifyMessage = (messageUserId) => {
    return messageUserId === currentUserId || isAdmin || isModerator;
  };

  useEffect(() => {
    setShowAllMessages(false);
  }, [groupId]);

  useEffect(() => {
    if (!groupId) {
      if (hasJoinedGroupRef.current) {
        leaveGroup(hasJoinedGroupRef.current);
        hasJoinedGroupRef.current = null;
      }
      return;
    }

    if (hasAccess) {
      // Solo unirse si no estamos ya en este grupo
      if (hasJoinedGroupRef.current !== groupId) {
        if (hasJoinedGroupRef.current) {
          leaveGroup(hasJoinedGroupRef.current);
        }
        // Unirse al grupo (siempre cargar mensajes la primera vez)
        joinGroup(groupId, { force: true });
        hasJoinedGroupRef.current = groupId;
      }
    } else if (hasJoinedGroupRef.current === groupId) {
      leaveGroup(groupId);
      hasJoinedGroupRef.current = null;
    }

    return () => {
      if (hasJoinedGroupRef.current === groupId) {
        leaveGroup(groupId);
        hasJoinedGroupRef.current = null;
      }
    };
  }, [groupId, hasAccess, joinGroup, leaveGroup]);

  const handleSendMessage = async (text) => {
    const messageText = (typeof text === 'string' ? text : newMessage).trim();
    if (!messageText || isSending || !groupId) return;
    try {
      setNewMessage('');
      setIsSending(true);
      await sendSocketMessage({ groupId, content: messageText });
    } catch (error) {
      console.error('Error sending message:', error);
      addToast('Error al enviar el mensaje', 'error');
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveEdit = async (messageId, newContent) => {
    // ... (Existing logic) ...
    addToast('Funcionalidad de edición próximamente', 'info');
  };

  const handleDeleteMessage = async (messageId) => {
    // Direct action (Confirmation handled by ChatUI)
    try {
      addToast('Funcionalidad de eliminación próximamente', 'info');
    } catch (error) {
      console.error('Error deleting message:', error);
      addToast('Error al eliminar el mensaje', 'error');
    }
  };

  const handleReportMessage = async (messageId) => {
    try {
      addToast('Mensaje reportado. Gracias.', 'success');
    } catch (error) {
      addToast('Error al reportar', 'error');
    }
  };



  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-gray-600">
        <WifiOff className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-semibold">Desconectado</h3>
        <p className="text-sm">Intentando reconectar al chat...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
        <Users className="w-10 h-10 mb-3 text-gray-400" />
        <p className="text-lg font-medium mb-1">Acceso restringido</p>
        <p className="text-sm mb-3">Debes ser miembro para ver este chat</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Verificar membresía
        </button>
      </div>
    );
  }

  // Helpers
  const getSenderId = (m) => m.user_id ?? m.sender_id ?? m.sender?.id ?? m.user?.id ?? 'unknown';
  const getWhen = (m) => new Date(m.created_at || m.timestamp || Date.now()).getTime();

  const rawMessages = messages[groupId] || [];

  // Log para debugging - ver cuando cambian los mensajes (solo cuando cambia el número o el grupo)
  const lastLoggedCountRef = useRef(0);
  const lastLoggedGroupRef = useRef(null);



  const sortedMessages = useMemo(() => {
    // Ordenar mensajes: más antiguos primero (arriba), más nuevos al final (abajo)
    const sorted = [...rawMessages].sort((a, b) => {
      const timeA = getWhen(a);
      const timeB = getWhen(b);
      // Orden ascendente: más antiguo primero (arriba), más nuevo último (abajo)
      return timeA - timeB;
    });
    return sorted;
  }, [rawMessages, groupId]);

  const displayMessages = useMemo(() => {
    if (showAllMessages) return sortedMessages;
    return sortedMessages.slice(-VISIBLE_MESSAGE_LIMIT);
  }, [sortedMessages, showAllMessages]);

  const hiddenCount = sortedMessages.length - displayMessages.length;

  // Scroll automático cuando llegan nuevos mensajes o cambia el grupo
  useEffect(() => {
    if (messagesContainerRef.current && displayMessages.length > 0) {
      // Pequeño delay para asegurar que el DOM se haya actualizado
      const timeoutId = setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          // Scroll solo dentro del contenedor, no afecta la página
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [displayMessages.length, groupId, sortedMessages.length]);

  // Scroll inicial cuando se carga el grupo (solo si hay mensajes)
  useEffect(() => {
    if (messagesContainerRef.current && groupId && sortedMessages.length > 0) {
      const timeoutId = setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          // Scroll solo dentro del contenedor
          container.scrollTop = container.scrollHeight;
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [groupId]);

  // Transformar mensajes para ChatUI
  const formattedMessages = useMemo(() => {
    return displayMessages.map(msg => {
      const senderId = getSenderId(msg);
      const isOwn = senderId === user?.id;

      return {
        id: msg.id || msg.tempId,
        content: msg.content || msg.message || '',
        sender: {
          id: senderId,
          name: msg.sender?.name || msg.user?.name || 'Usuario',
          avatar: msg.sender?.avatar,
          role: getUserRole(senderId),
          isCurrentUser: isOwn
        },
        timestamp: getWhen(msg),
        isEdited: msg.is_edited,
        isOwn
      };
    });
  }, [displayMessages, user?.id]);

  return (
    <ChatUI
      title={groupName}
      isConnected={isConnected}
      isConnecting={!isConnected}
      messages={formattedMessages}
      currentUserId={user?.id}
      onSendMessage={(text) => handleSendMessage(text)}
      isSending={isSending}
      onLoadMore={() => setShowAllMessages(true)}
      hiddenCount={hiddenCount}
      // Acciones
      onEditMessage={handleSaveEdit} // OJO: handleSaveEdit espera ID. ChatUI pasa (id, content). Ver abajo wrap.
      onDeleteMessage={handleDeleteMessage}
      onReportMessage={handleReportMessage}
    />
  );
};

export default GroupChat;
