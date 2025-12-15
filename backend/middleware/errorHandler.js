
// Clase personalizada para errores operacionales
class AppError extends Error {
  constructor(message, statusCode, field = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.field = field;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Wrapper para funciones async para capturar errores
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Función para crear errores de validación
const createValidationError = (message, errors = []) => {
  const error = new AppError(message, 400);
  error.errors = errors;
  return error;
};

// Función para crear errores de no encontrado
const createNotFoundError = (resource) => {
  return new AppError(`${resource} no encontrado`, 404);
};

// Función para crear errores de autorización
const createAuthError = (message = 'No autorizado') => {
  return new AppError(message, 401);
};

// Función para crear errores de permisos
const createForbiddenError = (message = 'Permisos insuficientes') => {
  return new AppError(message, 403);
};

// Función para crear errores de conflicto
const createConflictError = (message) => {
  return new AppError(message, 409);
};

// Middleware principal de manejo de errores
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message || 'Error del servidor';
  error.errors = err.errors || [];
  error.message = err.message;

  // Log del error deshabilitado

  // Error operacional personalizado
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.field && { field: err.field }),
      ...(err.errors && { errors: err.errors })
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.message = 'Token inválido';
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = 'Token expirado';
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error.statusCode = 400;
    error.message = 'JSON inválido';
  }

  // Error de validación
  if (error.name === 'ValidationError' || error.name === 'SequelizeValidationError' || error.statusCode === 400) {
    const message = error.message || 'Error de validación de datos';
    error = new AppError(message, 400);
    
    // Si ya hay errores formateados, usarlos
    if (error.errors && error.errors.length > 0) {
      // Ya está formateado correctamente
    } else if (err.errors && Array.isArray(err.errors)) {
      // Si viene de express-validator
      error.errors = err.errors;
    } else if (err.errors) {
      // Si es de Sequelize
      error.errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }));
    }
  }

  // Error por defecto
  if (!error.statusCode) {
    error.statusCode = 500;
    error.message = 'Error interno del servidor';
  }

  // Respuesta de error
  const response = {
    success: false,
    error: error.message || 'Error del servidor',
  };

  // Solo incluir detalles de validación en desarrollo o si son errores de validación
  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  // Solo incluir stack trace en desarrollo
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

module.exports = {
  AppError,
  asyncHandler,
  createValidationError,
  createNotFoundError,
  createAuthError,
  createForbiddenError,
  createConflictError,
  errorHandler
};