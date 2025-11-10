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
  
  body('delivery_type')
    .notEmpty().withMessage('El tipo de entrega es requerido')
    .isString().withMessage('El tipo de entrega debe ser texto')
    .isIn(['home_delivery', 'pickup', 'store_pickup'])
    .withMessage('Tipo de entrega inválido. Debe ser: home_delivery, pickup o store_pickup'),
  
  body('delivery_address')
    .optional()
    .isString().withMessage('La dirección debe ser texto')
    .trim(),
  
  body('payment_receipt_url')
    .optional()
    .isString().withMessage('La URL del comprobante debe ser texto'),
  
  body('productOrders')
    .optional()
    .isArray().withMessage('productOrders debe ser un array')
    .custom((value) => {
      if (value && value.length > 0) {
        return value.every((item: any) => 
          item.id_product && 
          item.quantity && 
          item.price_unit &&
          typeof item.id_product === 'number' &&
          typeof item.quantity === 'number' &&
          typeof item.price_unit === 'number'
        );
      }
      return true;
    }).withMessage('Cada producto debe tener id_product, quantity y price_unit válidos')
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
