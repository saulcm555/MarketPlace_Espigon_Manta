/// <reference path="../../../types/express.d.ts" />
import { Request, Response } from "express";
import { CreateOrder } from "../../../application/use_cases/orders/CreateOrder";
import { UpdateOrderStatus } from "../../../application/use_cases/orders/UpdateOrderStatus";
import { QueryOrders } from "../../../application/use_cases/orders/QueryOrders";
import { OrderService } from "../../../domain/services/OrderService";
import { CartService } from "../../../domain/services/CartService";
import { OrderRepositoryImpl } from "../../repositories/OrderRepositoryImpl";
import { CartRepositoryImpl } from "../../repositories/CartRepositoryImpl";
import { asyncHandler, NotFoundError } from "../../middlewares/errors";
import type { ProductCart } from "../../../domain/entities/cart";
import AppDataSource from "../../database/data-source";
import { ProductOrderEntity } from "../../../models/orderModel";

// Instancias de dependencias
const orderRepository = new OrderRepositoryImpl();
const cartRepository = new CartRepositoryImpl();
const orderService = new OrderService(orderRepository);
const cartService = new CartService(cartRepository);

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  // Para listar todas las órdenes (ADMIN), usamos directamente el servicio
  const orders = await orderService.getAllOrders();
  res.json(orders);
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  // Para clientes - obtener solo sus órdenes
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new Error("Usuario no autenticado");
  }

  const queryOrdersUseCase = new QueryOrders(orderService);
  const orders = await queryOrdersUseCase.getClientOrders({ id_client: userId });
  res.json(orders);
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const queryOrdersUseCase = new QueryOrders(orderService);
  const order = await queryOrdersUseCase.getOrderById({ id_order: Number(req.params.id) });
  
  if (!order) {
    throw new NotFoundError("Orden");
  }
  res.json(order);
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const createOrderUseCase = new CreateOrder(orderService, cartService);
  const order = await createOrderUseCase.execute(req.body);
  res.status(201).json(order);
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const updateOrderStatusUseCase = new UpdateOrderStatus(orderService);
  const id = Number(req.params.id);
  
  const order = await updateOrderStatusUseCase.execute({
    id_order: id,
    status: req.body.status,
  });
  
  res.json(order);
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const success = await orderService.deleteOrder(id.toString());
  
  if (!success) {
    throw new NotFoundError("Orden");
  }
  
  res.json({ message: "Orden eliminada correctamente" });
});

// Agregar/actualizar reseña en un producto de la orden
export const addReview = asyncHandler(async (req: Request, res: Response) => {
  const { id_product_order } = req.params;
  const { rating, review_comment } = req.body;
  
  const updated = await orderService.addReviewToProductOrder(
    Number(id_product_order),
    rating,
    review_comment
  );
  
  if (!updated) {
    throw new NotFoundError("Producto en orden");
  }
  
  res.json({ message: "Reseña agregada correctamente", data: updated });
});

// Obtener reseñas de un producto
export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { id_product } = req.params;
  
  const reviews = await orderService.getProductReviews(Number(id_product));
  
  res.json(reviews);
});

/**
 * PATCH /api/orders/:id/payment-receipt
 * Actualizar comprobante de pago de una orden
 * Cambia el status a 'payment_pending_verification'
 */
export const updatePaymentReceipt = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { payment_receipt_url } = req.body;

  if (!id) {
    return res.status(400).json({ message: "ID de orden requerido" });
  }

  if (!payment_receipt_url) {
    return res.status(400).json({ 
      message: "La URL del comprobante es requerida" 
    });
  }

  // Verificar que la orden existe
  const order = await orderService.getOrderById(id);
  if (!order) {
    throw new NotFoundError("Orden");
  }

  // Actualizar la orden con el comprobante y cambiar status
  const updatedOrder = await orderService.updateOrder(id, {
    payment_receipt_url,
    status: 'payment_pending_verification'
  });

  res.json({
    message: "Comprobante de pago actualizado correctamente",
    order: updatedOrder
  });
});

/**
 * PATCH /api/orders/:id/verify-payment
 * Verificar el pago de una orden (solo vendedor/admin)
 * Cambia el status a 'payment_confirmed' y registra la fecha de verificación
 */
export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approved } = req.body; // true = aprobado, false = rechazado

  if (!id) {
    return res.status(400).json({ message: "ID de orden requerido" });
  }

  // Verificar que la orden existe
  const order = await orderService.getOrderById(id);
  if (!order) {
    throw new NotFoundError("Orden");
  }

  // Verificar que tiene comprobante de pago
  if (!order.payment_receipt_url) {
    return res.status(400).json({
      message: "Esta orden no tiene un comprobante de pago adjunto"
    });
  }

  // Actualizar según la decisión
  const updateData = approved 
    ? {
        status: 'payment_confirmed',
        payment_verified_at: new Date()
      }
    : {
        status: 'payment_rejected',
        payment_verified_at: new Date()
      };

  const updatedOrder = await orderService.updateOrder(id, updateData);

  res.json({
    message: approved 
      ? "Pago verificado y aprobado correctamente" 
      : "Pago rechazado",
    order: updatedOrder
  });
});

/**
 * Obtener órdenes pendientes de verificación de pago para el seller
 * Solo muestra órdenes de productos que pertenecen al seller
 */
export const getSellerPendingPayments = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = req.user?.id_seller || req.user?.id;
  if (!sellerId) {
    return res.status(401).json({ message: "No se pudo identificar el vendedor" });
  }
  const allPendingOrders = await orderService.getOrdersByStatus('payment_pending_verification');
  
  const sellerPendingOrders = allPendingOrders.filter(order => {
    // Primero verificar en productOrders (relación directa y más confiable)
    if (order.productOrders && order.productOrders.length > 0) {
      const hasSellerProducts = order.productOrders.some((productOrder: any) => {
        return productOrder.product?.id_seller === sellerId;
      });
      if (hasSellerProducts) return true;
    }
    
    // Fallback: verificar en cart.productCarts
    if (order.cart?.productCarts) {
      return order.cart.productCarts.some((cartProduct: ProductCart) => {
        return cartProduct.product?.id_seller === sellerId;
      });
    }
    
    return false;
  });
  
  res.json(sellerPendingOrders);
});

/**
 * Obtener todas las órdenes del vendedor
 * Muestra todas las órdenes que contienen productos del vendedor
 */
export const getSellerOrders = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = req.user?.id_seller || req.user?.id;
  if (!sellerId) {
    return res.status(401).json({ message: "No se pudo identificar el vendedor" });
  }
  
  const allOrders = await orderService.getAllOrders();
  
  // Filtrar órdenes que contienen productos del vendedor
  const sellerOrders = allOrders.filter(order => {
    // Verificar en productOrders (relación directa)
    if (order.productOrders && order.productOrders.length > 0) {
      return order.productOrders.some((productOrder: any) => {
        return productOrder.product?.id_seller === sellerId;
      });
    }
    
    // Fallback: verificar en cart.productCarts
    if (order.cart?.productCarts) {
      return order.cart.productCarts.some((cartProduct: ProductCart) => {
        return cartProduct.product?.id_seller === sellerId;
      });
    }
    
    return false;
  });
  
  res.json(sellerOrders);
});

/**
 * PATCH /api/orders/:id/mark-delivered
 * Marcar un pedido como entregado (solo vendedor)
 * Cambia el status a 'delivered'
 */
export const markOrderAsDelivered = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const sellerId = req.user?.id_seller || req.user?.id;

  if (!id) {
    return res.status(400).json({ message: "ID de orden requerido" });
  }

  if (!sellerId) {
    return res.status(401).json({ message: "No se pudo identificar el vendedor" });
  }

  // Verificar que la orden existe
  const order = await orderService.getOrderById(id);
  if (!order) {
    throw new NotFoundError("Orden");
  }

  // Verificar que el vendedor tiene productos en esta orden
  let hasSellerProducts = false;
  
  // Verificar en productOrders
  if (order.productOrders && order.productOrders.length > 0) {
    hasSellerProducts = order.productOrders.some((productOrder: any) => {
      return productOrder.product?.id_seller === sellerId;
    });
  }
  
  // Fallback: verificar en cart.productCarts
  if (!hasSellerProducts && order.cart?.productCarts) {
    hasSellerProducts = order.cart.productCarts.some((cartProduct: ProductCart) => {
      return cartProduct.product?.id_seller === sellerId;
    });
  }

  if (!hasSellerProducts) {
    return res.status(403).json({ 
      message: "No tienes permiso para marcar esta orden como entregada" 
    });
  }

  // Verificar que el estado actual permite la transición a delivered
  // Permitido desde: pending (pago efectivo), payment_confirmed, processing, shipped
  const validStatuses = ['pending', 'payment_confirmed', 'processing', 'shipped'];
  if (!validStatuses.includes(order.status)) {
    return res.status(400).json({ 
      message: `No se puede marcar como entregado desde el estado: ${order.status}` 
    });
  }

  // Actualizar el estado a delivered usando el caso de uso
  const updateOrderStatusUseCase = new UpdateOrderStatus(orderService);
  const updatedOrder = await updateOrderStatusUseCase.execute({
    id_order: Number(id),
    status: 'delivered',
  });

  res.json({
    message: "Pedido marcado como entregado correctamente",
    order: updatedOrder
  });
});

/**
 * GET /api/product-orders
 * Obtener todos los product_orders (para reportes internos)
 */
export const getProductOrders = asyncHandler(async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(ProductOrderEntity);
  const productOrders = await repo.find({
    relations: ['product', 'order'],
    take: 10000 // Límite alto para reportes
  });
  res.json(productOrders);
});
