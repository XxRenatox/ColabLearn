/**
 * Servicio de logging centralizado
 * Todos los logs del frontend se envían al backend para mostrarse en la consola del servidor
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Cola de logs para enviar en batch
let logQueue = [];
let isSending = false;
let sendTimeout = null;

// Función para enviar logs al backend
const sendLogsToBackend = async () => {
  if (isSending || logQueue.length === 0) return;
  
  isSending = true;
  const logsToSend = [...logQueue];
  logQueue = [];
  
  try {
    // Enviar cada log individualmente para evitar problemas de tamaño
    for (const log of logsToSend) {
      try {
        await fetch(`${API_BASE_URL}/logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            level: log.level,
            message: log.message,
            data: log.data,
            timestamp: log.timestamp,
            url: window.location.href,
            userAgent: navigator.userAgent
          }),
          // No bloquear si falla
          signal: AbortSignal.timeout(1000)
        }).catch(() => {
          // Silenciar errores de red para no crear loops
        });
      } catch (error) {
        // Silenciar errores
      }
    }
  } catch (error) {
    // Silenciar errores
  } finally {
    isSending = false;
  }
};

// Función para agregar log a la cola
const queueLog = (level, message, ...args) => {
  const logData = {
    level,
    message: typeof message === 'string' ? message : JSON.stringify(message),
    data: args.length > 0 ? args.map(arg => {
      try {
        if (typeof arg === 'object') {
          return JSON.stringify(arg);
        }
        return String(arg);
      } catch {
        return '[Object]';
      }
    }).join(' ') : undefined,
    timestamp: new Date().toISOString()
  };
  
  logQueue.push(logData);
  
  // Enviar logs después de un pequeño delay para agruparlos
  if (sendTimeout) {
    clearTimeout(sendTimeout);
  }
  
  sendTimeout = setTimeout(() => {
    sendLogsToBackend();
  }, 100);
};

// Interceptar console.log, console.error, console.warn
const originalConsole = {
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console)
};

// Reemplazar console.log, console.error, console.warn
console.log = (...args) => {
  queueLog('log', ...args);
  // No mostrar en el navegador
};

console.error = (...args) => {
  queueLog('error', ...args);
  // No mostrar en el navegador
};

console.warn = (...args) => {
  queueLog('warn', ...args);
  // No mostrar en el navegador
};

console.info = (...args) => {
  queueLog('info', ...args);
  // No mostrar en el navegador
};

// Exportar funciones de logging personalizadas si se necesitan
export const logger = {
  log: (...args) => queueLog('log', ...args),
  error: (...args) => queueLog('error', ...args),
  warn: (...args) => queueLog('warn', ...args),
  info: (...args) => queueLog('info', ...args)
};

// Enviar logs pendientes antes de cerrar la página
window.addEventListener('beforeunload', () => {
  if (logQueue.length > 0) {
    // Usar sendBeacon para logs críticos antes de cerrar
    const logs = logQueue.map(log => JSON.stringify(log)).join('\n');
    navigator.sendBeacon(`${API_BASE_URL}/logs`, logs);
  }
});

export default logger;

