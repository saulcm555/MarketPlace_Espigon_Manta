import { body, param } from 'express-validator';

/**
 * Validaciones para crear cliente
 */
export const createClientValidation = [
  body('client_name')
    .notEmpty().withMessage('El nombre del cliente es requerido')
    .isString().withMessage('El nombre debe ser texto')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres')
    .trim(),
  
  body('client_email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('client_password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('phone')
    .optional()
    .isString().withMessage('El teléfono debe ser texto')
    .trim(),
  
  body('address')
    .optional()
    .isString().withMessage('La dirección debe ser texto')
    .trim()
];

/**
 * Validaciones para actualizar cliente
 */
export const updateClientValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID debe ser un número entero positivo'),
  
  body('client_name')
    .optional()
    .isString().withMessage('El nombre debe ser texto')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres')
    .trim(),
  
  body('client_email')
    .optional()
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isString().withMessage('El teléfono debe ser texto')
    .trim(),
  
  body('address')
    .optional()
    .isString().withMessage('La dirección debe ser texto')
    .trim()
];

/**
 * Validaciones para obtener cliente por ID
 */
export const getClientByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID debe ser un número entero positivo')
];
