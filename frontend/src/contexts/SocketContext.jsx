import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useApp } from './AppContext';
import { chatAPI } from '../services/api';
import { getAuthToken, clearAuthToken } from '@/services/tokenManager';

const SocketContext = createContext(null);

const normalizeResponse = (response) => {
  if (response === null || response === undefined) {
    return response;
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (typeof response === 'object') {
    if ('data' in response && response.data !== undefined) {
      return response.data;
    }
    if ('success' in response && response.success && response.data !== undefined) {
      return response.data;
    }
  }

  return response;
};

const normalizeMessage = (message) => {
  if (!message || typeof message !== 'object') {
    return null;
  }

  const sender = message.sender || message.user || message.users || null;
  const senderId = message.sender_id || message.senderId || sender?.id || message.user_id || null;
  const groupId = message.groupId || message.group_id || null;

  return {
    id: message.id || null,
    tempId: message.tempId || null,
    groupId,
    group_id: groupId,
    sessionId: message.sessionId || message.session_id || null,
    session_id: message.sessionId || message.session_id || null,
    content: message.content || message.message || '',
    status: message.status || 'sent',
    created_at: message.created_at || message.timestamp || message.createdAt || new Date().toISOString(),
    updated_at: message.updated_at || message.updatedAt || message.created_at || null,
    sender_id: senderId,
    user_id: message.user_id || senderId,
    sender: sender
      ? {
        id: sender.id || senderId,
        name: sender.name || sender.full_name || 'Usuario',
        avatar: sender.avatar || '👤',
        email: sender.email || null,
      }
      : {
        id: senderId,
        name: message.sender_name || 'Usuario',
        avatar: message.sender_avatar || '👤',
        email: message.sender_email || null,
      },
  };
};

export const SocketProvider = ({ children }) => {
  const { user } = useApp();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState({});
  const [connectionError, setConnectionError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const activeGroupRef = useRef(null);
  const messagesRef = useRef({});
  const joiningGroupsRef = useRef(new Set());

  const loadingGroupsRef = useRef(new Set());

  const loadMessages = useCallback(async (groupId, params = {}) => {
    if (!groupId) return [];

    // Evitar cargar mensajes múltiples veces para el mismo grupo
    if (loadingGroupsRef.current.has(groupId)) {
      return messagesRef.current[groupId] || [];
    }

    loadingGroupsRef.current.add(groupId);
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatAPI.getMessages(groupId, params);
      const payload = normalizeResponse(response);
      const list = Array.isArray(payload?.messages)
        ? payload.messages
        : Array.isArray(payload)
          ? payload
          : [];
      const normalizedMessages = list
        .map((message) => normalizeMessage({ ...message, groupId }))
        .filter(Boolean);

      // Ordenar mensajes por fecha (más antiguo primero)
      normalizedMessages.sort((a, b) => {
        const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
        const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
        return timeA - timeB; // Ascendente: más antiguo primero
      });

      setMessages((prev) => ({
        ...prev,
        [groupId]: normalizedMessages,
      }));

      return normalizedMessages;
    } catch (err) {
      // No establecer error aquí, solo retornar array vacío
      // El socket puede devolver los mensajes

      return [];
    } finally {
      setIsLoading(false);
      loadingGroupsRef.current.delete(groupId);
    }
  }, []);

  useEffect(() => {
    activeGroupRef.current = activeGroup;
  }, [activeGroup]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!user?.id) {
      setMessages({});
      setActiveGroup(null);
      setIsConnected(false);
      if (socket) {
        socket.disconnect();
      }
      setSocket(null);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      return;
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketInstance = io(baseUrl.replace(/\/api$/, ''), {
      path: '/socket.io/',
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);

      const groupToJoin = activeGroupRef.current;
      if (groupToJoin) {
        socketInstance.emit('joinGroup', groupToJoin, () => { });
      }
    };

    const onConnectError = (error) => {
      setConnectionError(error.message);

      if (
        error.message.includes('Authentication') ||
        error.message.includes('User not found') ||
        error.message.includes('Invalid token')
      ) {
        setTimeout(() => {
          clearAuthToken();
          window.location.href = '/login';
        }, 1000);
      }
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        socketInstance.connect();
      }
    };

    const onNewMessage = async (message) => {

      const normalized = normalizeMessage(message);
      if (!normalized?.groupId) {

        return;
      }

      setMessages((prev) => {
        const current = prev[normalized.groupId] || [];

        // Filtrar mensajes temporales que coincidan con este mensaje real
        const sanitized = current.filter((msg) => {
          if (msg.status !== 'sending') return true;
          const sameSender =
            (msg.sender_id && msg.sender_id === normalized.sender_id) ||
            (msg.sender?.id && msg.sender.id === normalized.sender_id);
          const sameContent = msg.content === normalized.content;
          // Eliminar mensaje temporal si coincide con el mensaje real
          return !(sameSender && sameContent);
        });

        // Verificar si el mensaje ya existe
        const existingIndex = sanitized.findIndex(
          (msg) =>
            (normalized.id && msg.id === normalized.id) ||
            (normalized.tempId && msg.tempId === normalized.tempId) ||
            (normalized.id && msg.tempId && msg.content === normalized.content &&
              ((msg.sender_id === normalized.sender_id) || (msg.sender?.id === normalized.sender_id)))
        );

        if (existingIndex !== -1) {
          // Actualizar mensaje existente (reemplazar completamente con el mensaje del servidor)

          const updated = [...sanitized];
          // Usar el mensaje normalizado del servidor, que tiene el created_at correcto
          updated[existingIndex] = {
            ...normalized,
            status: 'sent',
            // Preservar el tempId si existe para referencia
            tempId: updated[existingIndex].tempId || normalized.tempId
          };

          // Ordenar por fecha después de actualizar
          updated.sort((a, b) => {
            const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
            const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
            return timeA - timeB;
          });

          return {
            ...prev,
            [normalized.groupId]: updated,
          };
        }

        // Agregar nuevo mensaje y ordenar por fecha

        const updated = [...sanitized, normalized];

        // Ordenar por fecha de creación (más antiguo primero)
        updated.sort((a, b) => {
          const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
          const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
          return timeA - timeB;
        });

        return {
          ...prev,
          [normalized.groupId]: updated,
        };
      });

      if (activeGroupRef.current === normalized.groupId && normalized.id) {
        try {
          await chatAPI.markAsRead(normalized.groupId, [normalized.id]);
        } catch {
          // Ignorar errores al marcar como leído
        }
      }
    };

    const onNewSessionMessage = async (message) => {

      const normalized = normalizeMessage(message);
      if (!normalized?.sessionId) {

        return;
      }

      // Reutilizamos la misma logica de setMessages usando sessionId como key
      setMessages((prev) => {
        const current = prev[normalized.sessionId] || [];
        // Filtrar temporales
        const sanitized = current.filter((msg) => {
          if (msg.status !== 'sending') return true;
          const sameSender = (msg.sender?.id === normalized.sender_id);
          const sameContent = msg.content === normalized.content;
          return !(sameSender && sameContent);
        });

        // Verificar existencia
        const existingIndex = sanitized.findIndex(m => m.id === normalized.id || m.tempId === normalized.tempId);

        if (existingIndex !== -1) {
          const updated = [...sanitized];
          updated[existingIndex] = { ...normalized, status: 'sent', tempId: updated[existingIndex].tempId };
          updated.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
          return { ...prev, [normalized.sessionId]: updated };
        }

        const updated = [...sanitized, normalized];
        updated.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        return { ...prev, [normalized.sessionId]: updated };
      });
    };

    const onMessageUpdated = (updatedMessage) => {
      const normalized = normalizeMessage(updatedMessage);
      if (!normalized?.groupId) {
        return;
      }

      setMessages((prev) => {
        const current = prev[normalized.groupId] || [];
        const index = current.findIndex(
          (msg) =>
            (normalized.id && msg.id === normalized.id) ||
            (normalized.tempId && msg.tempId === normalized.tempId)
        );

        if (index === -1) {
          return prev;
        }

        const nextMessages = [...current];
        nextMessages[index] = {
          ...nextMessages[index],
          ...normalized,
          status: normalized.status || nextMessages[index].status,
        };

        // Ordenar por fecha después de actualizar
        nextMessages.sort((a, b) => {
          const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
          const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
          return timeA - timeB; // Ascendente: más antiguo primero
        });

        return {
          ...prev,
          [normalized.groupId]: nextMessages,
        };
      });
    };

    const onMessageError = (errorData) => {
      if (errorData?.tempId) {
        setMessages((prev) => {
          const groupId = Object.keys(prev).find(gId =>
            prev[gId]?.some(msg => msg.tempId === errorData.tempId)
          );
          if (!groupId) return prev;

          const current = prev[groupId] || [];
          const index = current.findIndex((msg) => msg.tempId === errorData.tempId);
          if (index === -1) return prev;

          const updated = [...current];
          updated[index] = {
            ...updated[index],
            status: 'error',
            error: errorData.error || 'Error al enviar el mensaje',
          };
          return {
            ...prev,
            [groupId]: updated,
          };
        });
      }
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('connect_error', onConnectError);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('newMessage', onNewMessage);
    socketInstance.on('messageUpdated', onMessageUpdated);
    socketInstance.on('messageError', onMessageError);
    socketInstance.on('newSessionMessage', onNewSessionMessage);

    setSocket(socketInstance);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('connect_error', onConnectError);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('newMessage', onNewMessage);
      socketInstance.off('messageUpdated', onMessageUpdated);
      socketInstance.off('messageError', onMessageError);
      socketInstance.off('newSessionMessage', onNewSessionMessage);
      socketInstance.disconnect();
    };
  }, [user?.id]);

  const sendMessage = useCallback(
    async ({ groupId, content, tempId }) => {
      if (!socket || !groupId || !content) {
        throw new Error('Socket no conectado o faltan datos del mensaje');
      }

      const tempIdentifier = tempId || `temp-${Date.now()}`;
      const tempMessage = normalizeMessage({
        id: null,
        tempId: tempIdentifier,
        content,
        groupId,
        sender_id: user.id,
        status: 'sending',
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          email: user.email,
        },
      });

      // Agregar mensaje temporal inmediatamente para feedback visual
      setMessages((prev) => {
        const current = prev[groupId] || [];
        const updated = [...current, tempMessage];

        // Ordenar por fecha de creación (más antiguo primero)
        updated.sort((a, b) => {
          const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
          const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
          return timeA - timeB;
        });

        return {
          ...prev,
          [groupId]: updated,
        };
      });

      // Enviar mensaje a través de Socket.IO para tiempo real
      return new Promise((resolve, reject) => {
        socket.emit('sendMessage', { groupId, content, tempId: tempIdentifier }, (response) => {
          if (response?.error) {
            // Marcar mensaje como error
            setMessages((prev) => {
              const current = prev[groupId] || [];
              const index = current.findIndex((msg) => msg.tempId === tempIdentifier);
              if (index === -1) {
                return prev;
              }
              const updated = [...current];
              updated[index] = {
                ...updated[index],
                status: 'error',
                error: response.error,
              };
              return {
                ...prev,
                [groupId]: updated,
              };
            });
            reject(new Error(response.error));
            return;
          }

          if (response?.success && response?.message) {
            // El mensaje se actualizará automáticamente cuando llegue el evento 'newMessage'
            // del socket, así que solo actualizamos el estado local si es necesario
            const confirmedMessage = normalizeMessage({ ...response.message, groupId });

            setMessages((prev) => {
              const current = prev[groupId] || [];
              const index = current.findIndex(
                (msg) => msg.tempId === tempIdentifier || msg.tempId === confirmedMessage.tempId
              );

              const updated = [...current];
              if (index !== -1) {
                // Reemplazar completamente con el mensaje confirmado del servidor (tiene created_at correcto)
                updated[index] = {
                  ...confirmedMessage,
                  status: 'sent',
                  // Preservar tempId si existe
                  tempId: updated[index].tempId || confirmedMessage.tempId
                };
              } else {
                updated.push({ ...confirmedMessage, status: 'sent' });
              }

              // Eliminar duplicados y ordenar por fecha
              const deduped = [];
              const seenIds = new Set();
              const seenTemps = new Set();
              updated.forEach((msg) => {
                const idKey = msg.id || null;
                const tempKey = msg.tempId || null;
                if (idKey) {
                  if (seenIds.has(idKey)) return;
                  seenIds.add(idKey);
                } else if (tempKey) {
                  if (seenTemps.has(tempKey)) return;
                  seenTemps.add(tempKey);
                }
                deduped.push(msg);
              });

              // Ordenar por fecha de creación (más antiguo primero)
              deduped.sort((a, b) => {
                const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
                const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
                return timeA - timeB;
              });

              return {
                ...prev,
                [groupId]: deduped,
              };
            });

            resolve(confirmedMessage);
          } else {
            resolve(null);
          }
        });

        // Timeout para evitar que la promesa quede colgada
        setTimeout(() => {
          reject(new Error('Timeout enviando mensaje'));
        }, 10000);
      });
    },
    [socket, user?.id, user?.name, user?.avatar, user?.email]
  );

  const sendSessionMessage = useCallback(async ({ sessionId, content, tempId }) => {
    if (!socket || !sessionId || !content) throw new Error('Faltan datos');

    const tempIdentifier = tempId || `temp-${Date.now()}`;
    const tempMessage = normalizeMessage({
      id: null,
      tempId: tempIdentifier,
      content,
      sessionId, // Key concept
      sender_id: user.id,
      status: 'sending',
      created_at: new Date().toISOString(),
      sender: { ...user } // Simplified
    });

    // Optimistic Update
    setMessages(prev => {
      const current = prev[sessionId] || [];
      return { ...prev, [sessionId]: [...current, tempMessage] };
    });

    return new Promise((resolve, reject) => {
      socket.emit('sendSessionMessage', { sessionId, content, tempId: tempIdentifier }, (response) => {
        if (response?.error) {
          // Rollback or Error state (omitted for brevity, similar to group)

          reject(new Error(response.error));
        } else {
          resolve(response.message);
        }
      });
    });
  }, [socket, user]);

  const joinGroup = useCallback(
    async (groupId, options = {}) => {
      const { force = false } = options;
      if (!socket || !groupId) return;

      // Evitar unirse múltiples veces al mismo grupo (solo si no es forzado)
      if (!force && joiningGroupsRef.current.has(groupId)) {
        return;
      }

      // Si ya estamos en el grupo y tenemos mensajes, y no es forzado, solo asegurar socket
      if (!force && activeGroupRef.current === groupId && messagesRef.current[groupId] && messagesRef.current[groupId].length > 0) {
        // Ya estamos en el grupo y tenemos mensajes, solo asegurar que estamos en el socket
        socket.emit('joinGroup', groupId, () => { });
        return;
      }

      joiningGroupsRef.current.add(groupId);

      try {
        // Cargar mensajes solo si no los tenemos o si es forzado
        const hasMessages = messagesRef.current[groupId] && messagesRef.current[groupId].length > 0;
        const shouldFetch = force || !hasMessages;

        // Cargar mensajes antes de unirse al socket si es necesario
        // Si falla, continuar de todas formas ya que el socket también puede devolver mensajes
        if (shouldFetch) {
          try {
            await loadMessages(groupId);
          } catch (loadError) {
            // Si falla cargar mensajes, continuar de todas formas
            // El socket puede devolver los mensajes

          }
        }

        // Unirse al socket (el socket también puede devolver mensajes, pero ya los tenemos)
        socket.emit('joinGroup', groupId, (response) => {
          if (response?.error) {
            // Solo mostrar error si realmente no podemos unirnos
            // Si ya tenemos mensajes, no mostrar error
            const hasMessages = messagesRef.current[groupId] && messagesRef.current[groupId].length > 0;
            if (!hasMessages) {
              setError(response.error);
            }
            joiningGroupsRef.current.delete(groupId);
            return;
          }

          // Si el socket devuelve mensajes y no tenemos mensajes locales, usarlos
          if (Array.isArray(response?.messages) && response.messages.length > 0) {
            const currentMessages = messagesRef.current[groupId] || [];
            // Solo usar mensajes del socket si no tenemos mensajes locales o si es forzado
            if (currentMessages.length === 0 || force) {
              const normalized = response.messages
                .map((message) => normalizeMessage({ ...message, groupId }))
                .filter(Boolean);
              setMessages((prev) => ({
                ...prev,
                [groupId]: normalized,
              }));
            }
          }

          // Limpiar cualquier error previo si nos unimos exitosamente
          setError(null);
          setActiveGroup(groupId);
          activeGroupRef.current = groupId;
          joiningGroupsRef.current.delete(groupId);
        });
      } catch (error) {
        joiningGroupsRef.current.delete(groupId);
        // No establecer error aquí, solo loguear
        // El socket puede aún funcionar

        // No lanzar el error para que el componente pueda continuar
      }
    },
    [socket, loadMessages]
  );

  const leaveGroup = useCallback(
    (groupId) => {
      if (!socket || !groupId) return;
      socket.emit('leaveGroup', { groupId });
      if (activeGroupRef.current === groupId) {
        activeGroupRef.current = null;
      }
      if (activeGroup === groupId) {
        setActiveGroup(null);
      }
    },
    [socket, activeGroup]
  );

  const joinSession = useCallback(async (sessionId) => {
    if (!socket || !sessionId) return;

    // Check if we already have messages or joined? 
    // For simplicity, just emit join.
    socket.emit('joinSession', sessionId, (response) => {
      if (response?.success && response.messages) {
        const normalized = response.messages.map(m => normalizeMessage({ ...m, sessionId }));
        setMessages(prev => ({ ...prev, [sessionId]: normalized }));
      }
    });
  }, [socket]);

  const leaveSession = useCallback((sessionId) => {
    if (!socket || !sessionId) return;
    socket.emit('leaveSession', sessionId);
  }, [socket]);

  // Efecto para hacer scroll al final de los mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeGroup]);

  const value = {
    socket,
    isConnected,
    messages,
    joinGroup,
    leaveGroup,
    joinSession,
    leaveSession,
    sendMessage,
    sendSessionMessage,
    activeGroup,
    connectionError,
    isLoading,
    error,
    loadMessages: (groupId) => groupId ? loadMessages(groupId) : Promise.resolve([]),
    messagesEndRef
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
