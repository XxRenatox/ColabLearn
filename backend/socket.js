const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('./config/database');

const userSockets = new Map();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const normalizeMessage = (message = {}) => {
  if (!message || typeof message !== 'object') {
    return null;
  }

  const sender = message.sender || message.user || message.users || null;
  const senderId = message.sender_id || message.senderId || sender?.id || null;
  const groupId = message.groupId || message.group_id || null;

  return {
    id: message.id || null,
    tempId: message.tempId || null,
    groupId,
    group_id: groupId,
    content: message.content || message.message || '',
    status: message.status || 'sent',
    created_at: message.created_at || message.timestamp || new Date().toISOString(),
    updated_at: message.updated_at || message.created_at || new Date().toISOString(),
    sender_id: senderId,
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

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
    cookie: {
      name: 'io',
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });

  io.engine.on('headers', (headers) => {
    const origin = allowedOrigins[0];
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers.authorization || '').split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: token ausente'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        return next(new Error(`Invalid token: ${jwtError.message}`));
      }

      const { data: userRecord, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, avatar, role, is_active')
        .eq('id', decoded.userId)
        .maybeSingle();

      if (userError || !userRecord) {
        return next(new Error('Authentication error: usuario no encontrado'));
      }

      if (userRecord.is_active === false) {
        return next(new Error('Authentication error: cuenta desactivada'));
      }

      socket.user = {
        id: userRecord.id,
        role: decoded.role || userRecord.role || 'student',
        email: decoded.email || userRecord.email,
        name: decoded.name || userRecord.name,
        avatar: userRecord.avatar || '👤',
      };

      // El usuario se unirá a su sala personal en el evento 'connection'
      // para asegurar que esté disponible cuando se conecte

      if (!userSockets.has(socket.user.id)) {
        userSockets.set(socket.user.id, new Set());
      }
      userSockets.get(socket.user.id).add(socket.id);

      return next();
    } catch (error) {
      return next(new Error(`Error de autenticación: ${error.message}`));
    }
  });

  io.on('connection', (socket) => {
    // Unirse a la sala personal del usuario para recibir notificaciones
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
      console.log(`Usuario ${socket.user.id} conectado y unido a su sala personal`);
    }

    socket.on('joinGroup', async (groupId, callback) => {
      if (!socket.user?.id) {
        return callback?.({ success: false, error: 'No autenticado' });
      }

      try {
        const userRole = socket.user.role;
        
        // Los administradores tienen acceso a todos los grupos
        if (userRole !== 'admin') {
          const { data: membership, error: membershipError } = await supabaseAdmin
            .from('group_members')
            .select('role, status')
            .eq('user_id', socket.user.id)
            .eq('group_id', groupId)
            .maybeSingle();

          if (membershipError || !membership || membership.status !== 'active') {
            return callback?.({ success: false, error: 'No eres miembro de este grupo' });
          }
        }

        socket.join(`group:${groupId}`);

        socket.to(`group:${groupId}`).emit('userJoined', {
          userId: socket.user.id,
          groupId,
          timestamp: new Date().toISOString(),
          user: {
            id: socket.user.id,
            name: socket.user.name,
            avatar: socket.user.avatar,
          },
        });

        const { data: messages, error: messagesError } = await supabaseAdmin
          .from('messages')
          .select(`
            id,
            content,
            status,
            created_at,
            updated_at,
            group_id,
            sender_id,
            sender:users!inner(id, name, avatar, email)
          `)
          .eq('group_id', groupId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (messagesError) {
          return callback?.({
            success: false,
            error: 'Error al cargar mensajes',
            messages: [],
          });
        }

        callback?.({
          success: true,
          messages: (messages || []).map((msg) =>
            normalizeMessage({
              ...msg,
              groupId: groupId,
            })
          ),
        });
      } catch (error) {
        callback?.({
          success: false,
          error: 'Error al unirse al grupo',
          messages: [],
        });
      }
    });

    socket.on('leaveGroup', (groupId) => {
      if (!socket.user?.id) return;

      socket.leave(`group:${groupId}`);
      socket.to(`group:${groupId}`).emit('userLeft', {
        userId: socket.user.id,
        groupId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('sendMessage', async ({ groupId, content, tempId }, callback) => {
      if (!socket.user?.id) {
        return callback?.({
          success: false,
          error: 'No autenticado',
          tempId,
        });
      }

      try {
        const userRole = socket.user.role;
        
        // Los administradores pueden enviar mensajes a todos los grupos
        if (userRole !== 'admin') {
          const { data: membership, error: membershipError } = await supabaseAdmin
            .from('group_members')
            .select('role, status')
            .eq('user_id', socket.user.id)
            .eq('group_id', groupId)
            .maybeSingle();

          if (membershipError || !membership || membership.status !== 'active') {
            return callback?.({
              success: false,
              error: 'No tienes permiso para enviar mensajes en este grupo',
              tempId,
            });
          }
        }

        const tempMessage = normalizeMessage({
          id: tempId || `temp-${Date.now()}`,
          tempId: tempId || `temp-${Date.now()}`,
          content,
          groupId,
          sender_id: socket.user.id,
          status: 'sending',
          created_at: new Date().toISOString(),
          sender: {
            id: socket.user.id,
            name: socket.user.name,
            avatar: socket.user.avatar,
            email: socket.user.email,
          },
        });

        callback?.({
          success: true,
          message: tempMessage,
          tempId: tempMessage.tempId,
        });

        const { data: message, error: messageError } = await supabaseAdmin
          .from('messages')
          .insert([
            {
              content,
              group_id: groupId,
              sender_id: socket.user.id,
              status: 'sent',
            },
          ])
          .select(`
            id,
            content,
            status,
            created_at,
            updated_at,
            group_id,
            sender_id,
            sender:users!inner(id, name, avatar, email)
          `)
          .single();

        if (messageError || !message) {
          socket.emit('messageError', {
            tempId: tempMessage.id,
            error: 'Error al enviar el mensaje',
            timestamp: new Date().toISOString(),
          });
          return;
        }

        await supabaseAdmin
          .from('groups')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', groupId);

        const normalizedMessage = normalizeMessage({
          ...message,
          tempId: tempMessage.tempId,
          groupId,
        });

        // Emitir el mensaje a todos los miembros del grupo (incluyendo al remitente)
        io.to(`group:${groupId}`).emit('newMessage', {
          ...normalizedMessage,
          timestamp: normalizedMessage.created_at,
        });
      } catch (error) {
        socket.emit('messageError', {
          tempId,
          error: 'Error interno del servidor',
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on('markAsRead', async ({ messageIds, groupId }, callback) => {
      if (!socket.user?.id) {
        return callback?.({ success: false, error: 'No autenticado' });
      }

      try {
        const { error } = await supabaseAdmin
          .from('messages')
          .update({ status: 'read' })
          .in('id', messageIds || [])
          .eq('group_id', groupId)
          .neq('sender_id', socket.user.id);

        if (error) throw error;

        socket.to(`group:${groupId}`).emit('messagesRead', {
          messageIds,
          groupId,
          userId: socket.user.id,
          timestamp: new Date().toISOString(),
        });

        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, error: 'Error al actualizar mensajes' });
      }
    });

    socket.on('disconnect', () => {
      if (socket.user?.id && userSockets.has(socket.user.id)) {
        const sockets = userSockets.get(socket.user.id);
        sockets.delete(socket.id);

        if (sockets.size === 0) {
          userSockets.delete(socket.user.id);

          socket.rooms.forEach((room) => {
            if (room.startsWith('group:')) {
              socket.to(room).emit('userLeft', {
                userId: socket.user.id,
                groupId: room.replace('group:', ''),
                timestamp: new Date().toISOString(),
                reason: 'disconnected',
              });
            }
          });
        }
      }
    });

    socket.on('connect_error', () => {
      setTimeout(() => {
        if (socket.disconnected) {
          socket.connect();
        }
      }, 5000);
    });

    socket.emit('connection_established', {
      success: true,
      userId: socket.user?.id,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });

  return io;
};

module.exports = setupSocket;
