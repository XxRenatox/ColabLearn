const { body, query, param, validationResult } = require('express-validator');
const { isBefore, isAfter, isDate, addDays } = require('date-fns');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/database');

// Validadores comunes
const commonValidators = {
  email: () => body('email')
    .trim()
    .isEmail()
    .withMessage('Correo electrónico inválido')
    .normalizeEmail(),
    
  password: () => body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una letra mayúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe contener al menos un número')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('La contraseña debe contener al menos un carácter especial'),
    
  uuid: (field = 'id') => param(field)
    .isUUID()
    .withMessage('ID inválido'),
    
  date: (field, options = {}) => {
    const { required = true, future = false, past = false } = options;
    let validator = body(field);
    
    if (!required) {
      validator = validator.optional();
    }
    
    return validator
      .custom((value) => {
        if (!value) return !required;
        const date = new Date(value);
        if (isNaN(date.getTime())) return false;
        
        if (future && isBefore(date, new Date())) {
          throw new Error('La fecha debe ser futura');
        }
        
        if (past && isAfter(date, new Date())) {
          throw new Error('La fecha debe ser pasada');
        }
        
        return true;
      })
      .withMessage('Fecha inválida')
  }
};

// Validador de archivos
const fileValidators = {
  fileType: (field = 'file', allowedTypes = []) => (req, res, next) => {
    if (!req.file) {
      return next();
    }
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`
      });
    }
    
    next();
  },
  
  fileSize: (field = 'file', maxSizeMB = 5) => (req, res, next) => {
    if (!req.file) {
      return next();
    }
    
    const maxSize = maxSizeMB * 1024 * 1024; // Convertir a bytes
    
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`
      });
    }
    
    next();
  }
};

// Validador de recursos
const resourceValidators = {
  getResource: [
    param('id')
      .isUUID()
      .withMessage('ID de recurso inválido')
  ],
  
  deleteResource: [
    param('id')
      .isUUID()
      .withMessage('ID de recurso inválido')
  ],
  
  createResource: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('El nombre debe tener entre 2 y 255 caracteres')
      .matches(/^[\w\s\-áéíóúÁÉÍÓÚñÑ.,;:¡!¿?()]+$/u)
      .withMessage('El nombre contiene caracteres no permitidos'),
      
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder los 1000 caracteres'),
      
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Máximo 10 etiquetas permitidas'),
      
    body('tags.*')
      .isString()
      .withMessage('Cada etiqueta debe ser un texto')
      .isLength({ min: 1, max: 50 })
      .withMessage('Cada etiqueta debe tener entre 1 y 50 caracteres'),
      
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic debe ser un valor booleano'),
      
    body('groupId')
      .optional()
      .isUUID()
      .withMessage('ID de grupo inválido')
      .custom(async (value) => {
        if (!value) return true;
        const { data, error } = await supabase
          .from('groups')
          .select('id')
          .eq('id', value)
          .single();
          
        if (error || !data) {
          throw new Error('El grupo especificado no existe');
        }
        return true;
      })
  ],
  
  updateResource: [
    param('id').isUUID().withMessage('ID de recurso inválido'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder los 1000 caracteres')
  ]
};

// Validador de usuarios
const userValidators = {
  register: [
    commonValidators.email(),
    commonValidators.password(),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('El nombre debe tener entre 2 y 100 caracteres')
      .matches(/^[\p{L}\s-]+$/u)
      .withMessage('El nombre solo puede contener letras y espacios'),
      
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres')
      .matches(/^[a-zA-Z0-9_.-]+$/)
      .withMessage('El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos')
      .custom(async (value) => {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('username', value)
          .single();
          
        if (data) {
          throw new Error('El nombre de usuario ya está en uso');
        }
        return true;
      })
  ],
  
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
      
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La biografía no puede exceder los 500 caracteres'),
      
    body('website')
      .optional()
      .trim()
      .isURL()
      .withMessage('URL de sitio web inválida')
  ]
};

// Validador de grupos
const groupValidators = {
  createGroup: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('El nombre del grupo debe tener entre 3 y 100 caracteres'),
      
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder los 1000 caracteres'),
      
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('isPrivate debe ser un valor booleano'),
      
    body('maxMembers')
      .optional()
      .isInt({ min: 2, max: 100 })
      .withMessage('El número máximo de miembros debe estar entre 2 y 100')
  ],
  
  updateGroup: [
    param('id').isUUID().withMessage('ID de grupo inválido'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('El nombre del grupo debe tener entre 3 y 100 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder los 1000 caracteres')
  ]
};

// Middleware para manejar errores de validación
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    const errorMessages = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));
    
    return res.status(400).json({
      success: false,
      errors: errorMessages
    });
  };
};

module.exports = {
  commonValidators,
  fileValidators,
  resourceValidators,
  userValidators,
  groupValidators,
  validate
};
