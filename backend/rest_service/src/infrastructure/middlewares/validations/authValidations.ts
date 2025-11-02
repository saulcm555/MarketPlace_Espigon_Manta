import { body } from 'express-validator';

/**
 * Validaciones para login (client, seller, admin)
 */
export const loginValidation = [
  body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isString().withMessage('La contraseña debe ser texto')
];

/**
 * Validaciones para registro de cliente
 */
export const registerClientValidation = [
  body('client_name')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser texto')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres')
    .trim(),
  
  body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isString().withMessage('La contraseña debe ser texto')
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
