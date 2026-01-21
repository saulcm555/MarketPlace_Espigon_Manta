/// <reference path="../../../types/express.d.ts" />
import { Request, Response } from "express";
import { CreateOrder } from "../../../application/use_cases/orders/CreateOrder";
import { UpdateOrderStatus } from "../../../application/use_cases/orders/UpdateOrderStatus";
import { QueryOrders } from "../../../application/use_cases/orders/QueryOrders";
import { OrderService } from "../../../domain/services/OrderService";
import { CartService } from "../../../domain/services/CartService";
import { GymWebhookService } from "../../../domain/services/GymWebhookService";
import { OrderRepositoryImpl } from "../../repositories/OrderRepositoryImpl";
import { CartRepositoryImpl } from "../../repositories/CartRepositoryImpl";
import { asyncHandler, NotFoundError } from "../../middlewares/errors";
import type { ProductCart } from "../../../domain/entities/cart";
import AppDataSource from "../../database/data-source";
import { ProductOrderEntity } from "../../../models/orderModel";
import { ClientEntity } from "../../../models/clientModel";
import { SellerEntity } from "../../../models/sellerModel";
import { notifySellerStatsUpdated, notifyAdminStatsUpdated } from "../../clients/statsEventClient";

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
  const user = (req as any).user;
  console.log('[getMyOrders] User from token:', JSON.stringify(user, null, 2));
  
  // Primero intentar obtener id_client directo del token
  let clientIdRaw = user?.id_client ?? (user?.role === "client" ? user?.reference_id : null);
  
  // Si no existe, buscar en la base de datos por user_id (UUID de Supabase)
  if (!clientIdRaw && user?.id && user?.role === "client") {
    console.log('[getMyOrders] Buscando id_client por user_id:', user.id);
    const clientRepo = AppDataSource.getRepository(ClientEntity);
    const client = await clientRepo.findOne({ where: { user_id: user.id } });
    if (client) {
      clientIdRaw = client.id_client;
      console.log('[getMyOrders] Encontrado id_client desde DB:', clientIdRaw);
    }
  }
  
  console.log('[getMyOrders] clientIdRaw:', clientIdRaw);

  if (!clientIdRaw) {
    // Error 404 claro: el perfil del cliente no existe en la tabla clients
    throw new NotFoundError(
      "Perfil de cliente no encontrado. Por favor complete su registro o contacte soporte."
    );
  }

  const clientId = Number(clientIdRaw);
  console.log('[getMyOrders] clientId (numeric):', clientId);
  
  if (Number.isNaN(clientId)) {
    throw new NotFoundError("Identificador de cliente inválido");
  }

  const queryOrdersUseCase = new QueryOrders(orderService);
  const orders = await queryOrdersUseCase.getClientOrders({ id_client: clientId });
  console.log('[getMyOrders] Found orders count:', orders.length);
  console.log('[getMyOrders] Orders id_client values:', orders.map(o => o.id_client));
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
  
  // Obtener el email del usuario autenticado para validar cupones
  const user = (req as any).user;
  const orderData = {
    ...req.body,
    customer_email: user?.email || null // Email del usuario para validar cupón
  };
  
  const order = await createOrderUseCase.execute(orderData);
  
  // 📊 NOTIFICACIÓN DE ESTADÍSTICAS: Nuevo pedido creado
  if (order) {
    const sellerId = order.productOrders?.[0]?.product?.id_seller?.toString();
    if (sellerId) {
      notifySellerStatsUpdated(sellerId, {
        order_id: order.id_order,
        status: order.status,
        action: 'order_created'
      }).catch(err => console.error('Error notifying seller stats:', err));
    }
    
    notifyAdminStatsUpdated({
      order_id: order.id_order,
      status: order.status,
      action: 'order_created'
    }).catch(err => console.error('Error notifying admin stats:', err));

    // 🎁 WEBHOOK AL GYM: Enviar cupón cuando se complete un pedido
    // Nota: Por ahora enviamos el webhook apenas se crea el pedido
    // En producción, deberías enviar el webhook cuando el pedido esté "completado" o "pagado"
    if (order.status === 'pending' || order.status === 'confirmed') {
      // Obtener datos del cliente - priorizar user del token, fallback a order.client
      const clientEmail = user?.email || order.client?.client_email || 'unknown@email.com';
      const clientName = user?.name || order.client?.client_name || 'Cliente';
      const totalAmount = order.total_amount || 0;

      console.log(`[OrderController] Enviando webhook Gym - Email: ${clientEmail}, Name: ${clientName}, Amount: ${totalAmount}`);

      GymWebhookService.sendOrderCompletedWebhook({
        order_id: order.id_order,
        customer_email: clientEmail,
        customer_name: clientName,
        total_amount: totalAmount
      }).catch(err => console.error('[OrderController] Error enviando webhook al Gym:', err));
    }
  }
  
  res.status(201).json(order);
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const updateOrderStatusUseCase = new UpdateOrderStatus(orderService);
  const id = Number(req.params.id);
  
  const order = await updateOrderStatusUseCase.execute({
    id_order: id,
    status: req.body.status,
  });
  
  // 📊 NOTIFICACIÓN DE ESTADÍSTICAS: Estado de pedido actualizado
  if (order) {
    const sellerId = order.productOrders?.[0]?.product?.id_seller?.toString();
    if (sellerId) {
      notifySellerStatsUpdated(sellerId, {
        order_id: order.id_order,
        status: order.status,
        action: 'order_status_updated'
      }).catch(err => console.error('Error notifying seller stats:', err));
    }
    
    notifyAdminStatsUpdated({
      order_id: order.id_order,
      status: order.status,
      action: 'order_status_updated'
    }).catch(err => console.error('Error notifying admin stats:', err));
  }
  
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
    status: 'payment_pending_verification',
  });

  // 📊 NOTIFICACIÓN DE ESTADÍSTICAS: Comprobante de pago subido
  if (updatedOrder) {
    const sellerId = updatedOrder.productOrders?.[0]?.product?.id_seller?.toString();
    if (sellerId) {
      notifySellerStatsUpdated(sellerId, {
        order_id: updatedOrder.id_order,
        status: updatedOrder.status,
        action: 'payment_receipt_uploaded'
      }).catch(err => console.error('Error notifying seller stats:', err));
    }
    
    notifyAdminStatsUpdated({
      order_id: updatedOrder.id_order,
      status: updatedOrder.status,
      action: 'payment_receipt_uploaded'
    }).catch(err => console.error('Error notifying admin stats:', err));
  }

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

  // 📊 NOTIFICACIÓN DE ESTADÍSTICAS: Pago verificado
  if (updatedOrder) {
    const sellerId = updatedOrder.productOrders?.[0]?.product?.id_seller?.toString();
    if (sellerId) {
      notifySellerStatsUpdated(sellerId, {
        order_id: updatedOrder.id_order,
        status: updatedOrder.status,
        action: approved ? 'payment_verified' : 'payment_rejected'
      }).catch(err => console.error('Error notifying seller stats:', err));
    }
    
    notifyAdminStatsUpdated({
      order_id: updatedOrder.id_order,
      status: updatedOrder.status,
      action: approved ? 'payment_verified' : 'payment_rejected'
    }).catch(err => console.error('Error notifying admin stats:', err));
  }

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
  const user = req.user;
  let sellerId: number | undefined;
  
  // Si el token tiene id_seller numérico, usarlo directamente
  if (user?.id_seller && typeof user.id_seller === 'number') {
    sellerId = user.id_seller;
    console.log('[getSellerPendingPayments] Usando id_seller del token:', sellerId);
  } else if (user?.id) {
    // Buscar por user_id (UUID de Supabase) en la tabla seller
    const userId = String(user.id);
    console.log('[getSellerPendingPayments] Buscando seller por user_id (UUID):', userId);
    const sellerRepo = AppDataSource.getRepository(SellerEntity);
    const seller = await sellerRepo.findOne({ where: { user_id: userId } });
    
    if (seller) {
      sellerId = seller.id_seller;
      console.log('[getSellerPendingPayments] Encontrado id_seller numérico:', sellerId);
    }
  }
  
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
  
  console.log('[getSellerPendingPayments] Total órdenes pendientes para vendedor', sellerId, ':', sellerPendingOrders.length);
  res.json(sellerPendingOrders);
});

/**
 * Obtener todas las órdenes del vendedor
 * Muestra todas las órdenes que contienen productos del vendedor
 */
export const getSellerOrders = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  let sellerId: number | undefined;
  
  // Si el token tiene id_seller numérico, usarlo directamente
  if (user?.id_seller && typeof user.id_seller === 'number') {
    sellerId = user.id_seller;
    console.log('[getSellerOrders] Usando id_seller del token:', sellerId);
  } else if (user?.id) {
    // Buscar por user_id (UUID de Supabase) en la tabla seller
    const userId = String(user.id);
    console.log('[getSellerOrders] Buscando seller por user_id (UUID):', userId);
    const sellerRepo = AppDataSource.getRepository(SellerEntity);
    const seller = await sellerRepo.findOne({ where: { user_id: userId } });
    
    if (seller) {
      sellerId = seller.id_seller;
      console.log('[getSellerOrders] Encontrado id_seller numérico:', sellerId);
    }
  }
  
  if (!sellerId) {
    console.log('[getSellerOrders] No se pudo identificar el vendedor');
    return res.status(401).json({ message: "No se pudo identificar el vendedor" });
  }
  
  const allOrders = await orderService.getAllOrders();
  
  // Filtrar órdenes que contienen productos del vendedor (comparar con id_seller numérico)
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
  
  console.log('[getSellerOrders] Total órdenes encontradas para vendedor', sellerId, ':', sellerOrders.length);
  res.json(sellerOrders);
});

/**
 * PATCH /api/orders/:id/mark-delivered
 * Marcar un pedido como entregado (solo vendedor)
 * Cambia el status a 'delivered'
 */
export const markOrderAsDelivered = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  let sellerId: number | undefined;
  
  // Si el token tiene id_seller numérico, usarlo directamente
  if (user?.id_seller && typeof user.id_seller === 'number') {
    sellerId = user.id_seller;
  } else if (user?.id) {
    // Buscar por user_id (UUID de Supabase) en la tabla seller
    const userId = String(user.id);
    const sellerRepo = AppDataSource.getRepository(SellerEntity);
    const seller = await sellerRepo.findOne({ where: { user_id: userId } });
    if (seller) {
      sellerId = seller.id_seller;
    }
  }

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

  // 📊 NOTIFICACIÓN DE ESTADÍSTICAS: Pedido entregado
  if (updatedOrder) {
    const sellerId = updatedOrder.productOrders?.[0]?.product?.id_seller?.toString();
    if (sellerId) {
      notifySellerStatsUpdated(sellerId, {
        order_id: updatedOrder.id_order,
        status: 'delivered',
        action: 'order_delivered'
      }).catch(err => console.error('Error notifying seller stats:', err));
    }
    
    notifyAdminStatsUpdated({
      order_id: updatedOrder.id_order,
      status: 'delivered',
      action: 'order_delivered'
    }).catch(err => console.error('Error notifying admin stats:', err));
  }

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
