const express = require('express');
const router = express.Router();

// @route   POST /api/logs
// @desc    Recibir logs del frontend y mostrarlos en la consola del backend
// @access  Public (solo para logging)
router.post('/', (req, res) => {
  try {
    const { level, message, data, timestamp, url, userAgent } = req.body;
    
    const logTimestamp = timestamp || new Date().toISOString();
    const logPrefix = `[FRONTEND ${(level || 'log').toUpperCase()}]`;
    
    // Mostrar en consola del backend con formato
    const logData = {
      message: message || '',
      ...(data && { data }),
      ...(url && { url }),
      ...(userAgent && { userAgent }),
      timestamp: logTimestamp
    };
    
    switch (level) {
      case 'error':
        console.error(logPrefix, message || '', logData);
        break;
      case 'warn':
        console.warn(logPrefix, message || '', logData);
        break;
      case 'info':
      case 'log':
      default:
        console.log(logPrefix, message || '', logData);
        break;
    }
    
    // Responder rápidamente sin bloquear
    res.status(200).json({ success: true });
  } catch (error) {
    // Si hay error al procesar el log, no bloquear
    res.status(200).json({ success: true });
  }
});

module.exports = router;

