import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, data]);
        } catch (err) {
          // Error parsing WebSocket message
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Intentar reconectar después de 5 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = (error) => {
        setError(error);
      };

      wsRef.current = ws;
    } catch (err) {
      setError(err);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    messages,
    error,
    sendMessage,
    connect,
    disconnect
  };
};

// Hook específico para sesiones de estudio
export const useSessionWebSocket = (sessionId, userId) => {
  const wsUrl = import.meta.env.VITE_WS_URL || `ws://localhost:5000`;

  const { isConnected, messages, sendMessage } = useWebSocket(wsUrl);

  // Enviar mensaje de autenticación cuando se conecta
  useEffect(() => {
    if (isConnected && userId) {
      sendMessage({
        type: 'authenticate',
        userId
      });

      if (sessionId) {
        sendMessage({
          type: 'join-session',
          sessionId
        });
      }
    }
  }, [isConnected, userId, sessionId, sendMessage]);

  const sendSessionMessage = useCallback((messageData) => {
    sendMessage({
      type: 'session-message',
      sessionId,
      message: messageData.message,
      sender: messageData.sender,
      userId: messageData.userId,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage, sessionId]);

  const sendTypingIndicator = useCallback((isTyping) => {
    sendMessage({
      type: 'session-typing',
      sessionId,
      userId,
      isTyping
    });
  }, [sendMessage, sessionId, userId]);

  const sendProgressUpdate = useCallback((progress) => {
    sendMessage({
      type: 'session-progress',
      sessionId,
      userId,
      progress
    });
  }, [sendMessage, sessionId, userId]);

  // Filtrar mensajes de esta sesión
  const sessionMessages = messages.filter(msg =>
    msg.sessionId === sessionId || msg.type === 'notification'
  );

  return {
    isConnected,
    sessionMessages,
    sendSessionMessage,
    sendTypingIndicator,
    sendProgressUpdate
  };
};

export default useWebSocket;
