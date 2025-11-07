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

/**
 * Validaciones para registro de vendedor
 */
export const registerSellerValidation = [
  body('seller_name')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser texto')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres')
    .trim(),
  
  body('seller_email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('seller_password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isString().withMessage('La contraseña debe ser texto')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('phone')
    .notEmpty().withMessage('El teléfono es requerido')
    .isString().withMessage('El teléfono debe ser texto')
    .trim(),
  
  body('bussines_name')
    .notEmpty().withMessage('El nombre del negocio es requerido')
    .isString().withMessage('El nombre del negocio debe ser texto')
    .trim(),
  
  body('location')
    .notEmpty().withMessage('La ubicación es requerida')
    .isString().withMessage('La ubicación debe ser texto')
    .trim()
];
