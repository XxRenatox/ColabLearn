import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Loader, Wifi, WifiOff, Users, MessageSquare, MoreVertical, Edit, Trash2, Flag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../../../contexts/SocketContext';
import { useApp } from '../../../../contexts/AppContext';
import { useToast } from '../../../ui/Toast';
import { chatAPI } from '../../../../services/api';
import ConfirmModal from '../../../modals/ConfirmModal';

const GROUP_WINDOW_MS = 5 * 60 * 1000; // 5 min para agrupar mensajes consecutivos
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
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showMenuMessageId, setShowMenuMessageId] = useState(null);
  const chatEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
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
  
  // Función para verificar si el usuario puede editar/eliminar un mensaje
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const messageText = newMessage.trim();
    if (!messageText || isSending || !groupId) return;
    try {
      setNewMessage('');
      setIsSending(true);
      await sendSocketMessage({ groupId, content: messageText });
      // El mensaje se agregará automáticamente a través de Socket.IO
      // El scroll se hará automáticamente cuando el mensaje llegue
    } catch (error) {
      console.error('Error sending message:', error);
      addToast('Error al enviar el mensaje', 'error');
      // Restaurar el mensaje si hubo un error
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId, currentContent) => {
    setEditingMessageId(messageId);
    setEditContent(currentContent);
    setShowMenuMessageId(null);
  };

  const handleSaveEdit = async (messageId) => {
    if (!editContent.trim() || !groupId) return;
    try {
      // Aquí deberías llamar a una API para editar el mensaje
      // Por ahora, solo mostramos un toast
      addToast('Funcionalidad de edición próximamente', 'info');
      setEditingMessageId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing message:', error);
      addToast('Error al editar el mensaje', 'error');
    }
  };

  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [messageToReport, setMessageToReport] = useState(null);

  const handleDeleteMessage = async (messageId) => {
    setMessageToDelete(messageId);
    setShowDeleteMessageConfirm(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      // Aquí deberías llamar a una API para eliminar el mensaje
      // Por ahora, solo mostramos un toast
      addToast('Funcionalidad de eliminación próximamente', 'info');
      setShowMenuMessageId(null);
      setShowDeleteMessageConfirm(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      addToast('Error al eliminar el mensaje', 'error');
      setShowDeleteMessageConfirm(false);
      setMessageToDelete(null);
    }
  };

  const handleReportMessage = async (messageId) => {
    setMessageToReport(messageId);
    setShowReportConfirm(true);
  };

  const confirmReportMessage = async () => {
    if (!messageToReport) return;
    try {
      // Aquí deberías llamar a una API para reportar el mensaje
      addToast('Mensaje reportado. Gracias por tu reporte.', 'success');
      setShowMenuMessageId(null);
    } catch (error) {
      console.error('Error reporting message:', error);
      addToast('Error al reportar el mensaje', 'error');
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
  
  useEffect(() => {
    if (groupId && (rawMessages.length !== lastLoggedCountRef.current || groupId !== lastLoggedGroupRef.current)) {
      lastLoggedCountRef.current = rawMessages.length;
      lastLoggedGroupRef.current = groupId;
      
      console.log(`Mensajes del grupo ${groupId}:`, rawMessages.length, 'mensajes');
      console.log('Últimos mensajes:', rawMessages.slice(-3).map(m => ({
        id: m.id || m.tempId,
        content: m.content?.substring(0, 30),
        sender: m.sender?.name || m.user?.name
      })));
    }
  }, [rawMessages.length, groupId]);
  
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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{groupName}</h3>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" />
                <span className="truncate">Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-500 mr-1 flex-shrink-0" />
                <span className="truncate">Reconectando...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages con scroll igual que el otro */}
      <div
        ref={messagesContainerRef}
        className="flex-1 px-3 py-2 sm:px-4 sm:py-3 space-y-2 sm:space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 transition-all duration-200"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {hiddenCount > 0 && !showAllMessages && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowAllMessages(true)}
              className="rounded-full bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium text-blue-600 shadow-sm border border-blue-200 transition hover:bg-blue-50"
            >
              Ver los {hiddenCount} mensajes anteriores
            </button>
          </div>
        )}

        {showAllMessages && hiddenCount > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowAllMessages(false)}
              className="rounded-full bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium text-blue-600 shadow-sm border border-blue-200 transition hover:bg-blue-50"
            >
              Mostrar solo los más recientes
            </button>
          </div>
        )}

        {displayMessages.length ? (
          displayMessages.map((msg, index) => {
            const senderId = getSenderId(msg);
            const isOwn = senderId === user?.id;
            const name = isOwn ? 'Tú' : msg.sender?.name || msg.user?.name || 'Usuario';
            const content = msg.content || msg.message || '';
            const date = new Date(msg.created_at || msg.timestamp || Date.now());
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const userRole = getUserRole(senderId);
            const canModify = canModifyMessage(senderId);
            const isEditing = editingMessageId === (msg.id || msg.tempId);

            const prev = displayMessages[index - 1];
            const next = displayMessages[index + 1];
            const isGroupedWithPrev = prev && getSenderId(prev) === senderId && getWhen(msg) - getWhen(prev) <= GROUP_WINDOW_MS;
            const isGroupedWithNext = next && getSenderId(next) === senderId && getWhen(next) - getWhen(msg) <= GROUP_WINDOW_MS;

            const messageId = msg.id || msg.tempId || `${date.getTime()}-${senderId}-${index}`;
            const isHovered = hoveredMessageId === messageId;
            const showMenu = showMenuMessageId === messageId;

            const getRoleBadge = () => {
              if (!userRole || userRole === 'member') return null;
              if (userRole === 'admin') {
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white ml-1">ADMIN</span>;
              }
              if (userRole === 'moderator') {
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white ml-1">MOD</span>;
              }
              return null;
            };

            return (
              <div
                key={messageId}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                onMouseEnter={() => setHoveredMessageId(messageId)}
                onMouseLeave={() => {
                  setHoveredMessageId(null);
                  if (!showMenu) setShowMenuMessageId(null);
                }}
              >
                <div className={`relative max-w-[75%] ${isOwn ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                  {!isOwn && !isGroupedWithPrev && (
                    <div className="flex items-center gap-1 mb-1 px-1">
                      <span className="text-xs font-semibold text-gray-500">{name}</span>
                      {getRoleBadge()}
                    </div>
                  )}
                  <div
                    className={`relative p-2 sm:p-3 rounded-lg shadow-sm text-sm sm:text-base ${
                      isOwn ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-2 py-1 rounded bg-white text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditContent('');
                            }}
                            className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEdit(messageId)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap break-words">{content}</p>
                        <div className={`flex items-center justify-between gap-2 mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                          <span className="text-[10px]">{time}</span>
                          {msg.is_edited && (
                            <span className="text-[10px] italic">(editado)</span>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Menú de opciones */}
                    {isHovered && !isEditing && (
                      <div className={`absolute ${isOwn ? 'left-0 -translate-x-full mr-2' : 'right-0 translate-x-full ml-2'} top-0`}>
                        <button
                          onClick={() => setShowMenuMessageId(showMenu ? null : messageId)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isOwn 
                              ? 'bg-blue-500 hover:bg-blue-400 text-white' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Menú desplegable */}
                    {showMenu && !isEditing && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`absolute ${isOwn ? 'left-0 -translate-x-full mr-2' : 'right-0 translate-x-full ml-2'} top-8 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canModify && (
                          <>
                            <button
                              onClick={() => handleEditMessage(messageId, content)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(messageId)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </button>
                          </>
                        )}
                        {!isOwn && (
                          <button
                            onClick={() => handleReportMessage(messageId)}
                            className="w-full px-3 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                          >
                            <Flag className="w-4 h-4" />
                            Reportar
                          </button>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 mt-10">
            <p className="font-medium">No hay mensajes aún</p>
            <p className="text-sm">¡Escribe el primero!</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 flex items-center gap-2">
        <input
          ref={messageInputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          disabled={!isConnected || isSending}
          className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:opacity-50 bg-white"
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 transition disabled:opacity-50 font-medium text-xs sm:text-sm flex-shrink-0"
        >
          {isSending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">{isSending ? 'Enviando...' : 'Enviar'}</span>
        </button>
      </div>

      {/* Click fuera para cerrar menús */}
      {showMenuMessageId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenuMessageId(null)}
        />
      )}

      {/* Modal de confirmación para eliminar mensaje */}
      <ConfirmModal
        isOpen={showDeleteMessageConfirm}
        onClose={() => {
          setShowDeleteMessageConfirm(false);
          setMessageToDelete(null);
        }}
        onConfirm={confirmDeleteMessage}
        title="Eliminar mensaje"
        message="¿Estás seguro de que deseas eliminar este mensaje? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal de confirmación para reportar mensaje */}
      <ConfirmModal
        isOpen={showReportConfirm}
        onClose={() => {
          setShowReportConfirm(false);
          setMessageToReport(null);
        }}
        onConfirm={confirmReportMessage}
        title="Reportar mensaje"
        message="¿Deseas reportar este mensaje? Nuestro equipo revisará el contenido y tomará las medidas necesarias."
        confirmText="Reportar"
        cancelText="Cancelar"
        type="warning"
      />
    </div>
  );
};

export default GroupChat;
