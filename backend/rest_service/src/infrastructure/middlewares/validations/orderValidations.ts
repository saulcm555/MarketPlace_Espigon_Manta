import { body, param } from 'express-validator';

/**
 * Validaciones para crear orden
 */
export const createOrderValidation = [
  body('id_client')
    .notEmpty().withMessage('El ID del cliente es requerido')
    .isInt({ min: 1 }).withMessage('ID de cliente inválido'),
  
  body('id_cart')
    .notEmpty().withMessage('El ID del carrito es requerido')
    .isInt({ min: 1 }).withMessage('ID de carrito inválido'),
  
  body('id_payment_method')
    .notEmpty().withMessage('El método de pago es requerido')
    .isInt({ min: 1 }).withMessage('ID de método de pago inválido'),
  
  body('id_delivery')
    .notEmpty().withMessage('El método de entrega es requerido')
    .isInt({ min: 1 }).withMessage('ID de método de entrega inválido'),
  
  body('order_notes')
    .optional()
    .isString().withMessage('Las notas deben ser texto')
    .trim()
];

/**
 * Validaciones para actualizar estado de orden
 */
export const updateOrderValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID debe ser un número entero positivo'),
  
  body('status')
    .notEmpty().withMessage('El estado es requerido')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Estado inválido. Debe ser: pending, processing, shipped, delivered o cancelled')
];

/**
 * Validaciones para obtener orden por ID
 */
export const getOrderByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID debe ser un número entero positivo')
];
