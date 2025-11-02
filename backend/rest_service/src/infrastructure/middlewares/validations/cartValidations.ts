import { body, param } from 'express-validator';

/**
 * Validaciones para agregar producto al carrito (tabla transaccional ProductCart)
 */
export const addProductToCartValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID del carrito debe ser un número entero positivo'),
  
  body('id_cart')
    .notEmpty().withMessage('El ID del carrito es requerido')
    .isInt({ min: 1 }).withMessage('ID de carrito inválido'),
  
  body('id_product')
    .notEmpty().withMessage('El ID del producto es requerido')
    .isInt({ min: 1 }).withMessage('ID de producto inválido'),
  
  body('quantity')
    .notEmpty().withMessage('La cantidad es requerida')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1')
];

/**
 * Validaciones para actualizar cantidad en carrito
 */
export const updateCartItemValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID del carrito debe ser un número entero positivo'),
  
  param('productId')
    .isInt({ min: 1 }).withMessage('ID del producto debe ser un número entero positivo'),
  
  body('quantity')
    .notEmpty().withMessage('La cantidad es requerida')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1')
];

/**
 * Validaciones para crear carrito
 */
export const createCartValidation = [
  body('id_client')
    .notEmpty().withMessage('El ID del cliente es requerido')
    .isInt({ min: 1 }).withMessage('ID de cliente inválido')
];

/**
 * Validaciones para obtener carrito por ID
 */
export const getCartByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID debe ser un número entero positivo')
];
