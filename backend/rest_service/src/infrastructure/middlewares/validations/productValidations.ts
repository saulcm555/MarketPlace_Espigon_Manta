import { body, param, query } from 'express-validator';

/**
 * Validaciones para crear producto
 */
export const createProductValidation = [
  body('product_name')
    .notEmpty().withMessage('El nombre del producto es requerido')
    .isString().withMessage('El nombre debe ser texto')
    .trim(),
  
  body('product_price')
    .notEmpty().withMessage('El precio es requerido')
    .isFloat({ min: 0.01 }).withMessage('El precio debe ser mayor a 0'),
  
  body('id_category')
    .notEmpty().withMessage('La categoría es requerida')
    .isInt({ min: 1 }).withMessage('ID de categoría inválido'),
  
  body('id_seller')
    .notEmpty().withMessage('El vendedor es requerido')
    .isInt({ min: 1 }).withMessage('ID de vendedor inválido'),
  
  body('product_description')
    .optional()
    .isString().withMessage('La descripción debe ser texto')
    .trim(),
  
  body('product_image')
    .optional()
    .isString().withMessage('La imagen debe ser texto'),
  
  body('id_sub_category')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de subcategoría inválido')
];

/**
 * Validaciones para query params de listado de productos
 */
export const getProductsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
  
  query('min_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio mínimo debe ser mayor o igual a 0'),
  
  query('max_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio máximo debe ser mayor o igual a 0'),
  
  query('id_category')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de categoría inválido'),
  
  query('id_seller')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de vendedor inválido')
];

/**
 * Validaciones para eliminar producto
 */
export const deleteProductValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID debe ser un número entero positivo')
];
