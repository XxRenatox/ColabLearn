const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');
const os = require('os');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./config/database');

const app = express();
const server = http.createServer(app);

// Simple logger util
const log = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  const hasContext = context && Object.keys(context).length > 0;

};

const logger = {
  info: (message, context) => log('info', message, context),
  warn: (message, context) => log('warn', message, context),
  error: (message, context) => log('error', message, context),
  success: (message, context) => log('success', message, context),
};

process.on('unhandledRejection', (reason) => {
  logger.error('Promesa rechazada sin manejar', {
    reason: reason instanceof Error ? reason.message : reason,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada', { error: error.message });
});

server.on('error', (error) => {
  logger.error('Error en servidor HTTP', { error: error.message });
});

// Configuración de CORS
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

// Aplicar middlewares
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.headers.upgrade === 'websocket';
  }
});

app.use('/api', limiter);

// Middleware para subida de archivos (solo para rutas de recursos)
app.use('/api/resources', fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true,
  createParentPath: true,
  safeFileNames: true,
  preserveExtension: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Setup Socket.IO
const setupSocket = require('./socket');
const io = setupSocket(server);

// Make io available globally for routes
app.set('io', io);

// Function to send real-time notifications
const sendNotification = (userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

// Function to send group updates
const sendGroupUpdate = (groupId, update) => {
  io.to(`group:${groupId}`).emit('groupUpdate', update);
};

// Make functions available globally
app.set('sendNotification', sendNotification);
app.set('sendGroupUpdate', sendGroupUpdate);

// Middleware to attach io and user to requests
app.use((req, res, next) => {
  req.io = io;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.userId };
    } catch (error) {
      // Token inválido o expirado, continuar sin usuario
    }
  }
  next();
});

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const sessionRoutes = require('./routes/sessions');
const calendarRoutes = require('./routes/calendar');
const achievementRoutes = require('./routes/achievements');
const notificationRoutes = require('./routes/notifications');
const matchingRoutes = require('./routes/matching');
const connectionRoutes = require('./routes/connections');
const resourcesRoutes = require('./routes/resources');
const forumsRoutes = require('./routes/forums');
const logsRoutes = require('./routes/logs');
const adminRoutes = require('./routes/admin');

// Importar middlewares
const { errorHandler } = require('./middleware/errorHandler');
const { auth, requireRole } = require('./middleware/auth');

// Rutas públicas
app.use('/api/auth', authRoutes);
app.use('/api/logs', logsRoutes);

// Rutas de matching (requieren autenticación)
app.use('/api/matching', auth, matchingRoutes);

// Ruta de health check
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();

  res.json({
    status: dbStatus ? 'OK' : 'ERROR',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus ? 'Connected' : 'Disconnected',
    version: '1.0.0'
  });
});

// Rutas protegidas con middleware de autenticación
app.use('/api/users', auth, userRoutes);
app.use('/api/groups', auth, groupRoutes);
app.use('/api/sessions', auth, sessionRoutes);
app.use('/api/calendar', auth, calendarRoutes);
app.use('/api/achievements', auth, achievementRoutes);
app.use('/api/notifications', auth, notificationRoutes);
app.use('/api/connections', auth, connectionRoutes);
app.use('/api/resources', auth, resourcesRoutes);
app.use('/api/forums', auth, forumsRoutes);
app.use('/api/admin', auth, requireRole(['admin']), adminRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} no encontrado`
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Iniciar servidor
server.listen(PORT, async () => {
  logger.info('Iniciando servidor backend', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname(),
  });

  try {
    await testConnection();
    logger.success('Conexión a la base de datos verificada');
  } catch (error) {
    logger.error('No se pudo verificar la conexión a la base de datos', {
      error: error.message,
    });
  }

  logger.success('Servidor backend escuchando', {
    url: `http://localhost:${PORT}`,
  });

});