import { CreateOrderDto } from "../../dtos/orders/CreateOrder.dto";
import { OrderService } from "../../../domain/services/OrderService";
import { CartService } from "../../../domain/services/CartService";
import { Order } from "../../../domain/entities/order";
import AppDataSource from "../../../infrastructure/database/data-source";
import { OrderEntity, ProductOrderEntity } from "../../../models/orderModel";
import { ProductEntity } from "../../../models/productModel";
import { PaymentMethodEntity } from "../../../models/paymentMethodModel";
import { Coupon } from "../../../models/couponModel";
import { notifyOrderCreated } from "../../../infrastructure/clients/notificationClient";
import { notifySellerStatsUpdated, notifyAdminStatsUpdated } from "../../../infrastructure/clients/statsEventClient";
import { processPayment } from "../../../infrastructure/clients/paymentClient";

/**
 * Caso de uso para crear una nueva orden a partir de un carrito
 */
export class CreateOrder {
  constructor(
    private orderService: OrderService,
    private cartService: CartService
  ) {}

  /**
   * Ejecuta la creación de una nueva orden
   * @param data - Datos de la orden a crear
   * @returns Promise con la orden creada
   */
  async execute(data: CreateOrderDto): Promise<Order> {
    // Validar datos requeridos
    if (
      !data.id_client ||
      !data.id_cart ||
      !data.id_payment_method ||
      !data.delivery_type
    ) {
      throw new Error(
        "Cliente, carrito, método de pago y tipo de entrega son requeridos"
      );
    }

    // Obtener el carrito para calcular el total
    const cart = await this.cartService.getCartById(
      data.id_cart.toString()
    );

    if (!cart) {
      throw new Error(`Carrito con ID ${data.id_cart} no encontrado`);
    }

    // Validar que el carrito no esté vacío
    if (!data.productOrders || data.productOrders.length === 0) {
      throw new Error("No se pueden crear órdenes sin productos");
    }

    // Calcular el total desde productOrders
    let total_amount = data.productOrders.reduce(
      (sum, item) => sum + item.price_unit * item.quantity,
      0
    );

    let discount_amount = 0;
    let coupon_code: string | undefined;

    // 🎟️ APLICAR CUPÓN si se proporciona
    if (data.coupon_code && data.customer_email) {
      try {
        console.log(`🎟️ Validando cupón ${data.coupon_code} para usuario ${data.customer_email}...`);
        
        // Buscar el cupón directamente en la base de datos
        const couponRepo = AppDataSource.getRepository(Coupon);
        const coupon = await couponRepo.findOne({
          where: {
            code: data.coupon_code,
            customer_email: data.customer_email,
            is_active: true,
            used: false
          }
        });

        if (coupon) {
          // Verificar si está expirado
          if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
            console.warn(`⚠️ Cupón ${data.coupon_code} expirado`);
          } else if (total_amount < coupon.minimum_purchase) {
            console.warn(`⚠️ Cupón ${data.coupon_code} requiere compra mínima de $${coupon.minimum_purchase}`);
          } else {
            // Calcular descuento
            discount_amount = coupon.calculateDiscount(total_amount);
            total_amount = total_amount - discount_amount;
            coupon_code = data.coupon_code;
            console.log(`🎟️ Cupón ${data.coupon_code} aplicado: -$${discount_amount.toFixed(2)} | Nuevo total: $${total_amount.toFixed(2)}`);
          }
        } else {
          console.warn(`⚠️ Cupón ${data.coupon_code} no encontrado para el usuario ${data.customer_email}`);
        }
      } catch (error) {
        console.error('❌ Error al validar cupón:', error);
        // Continuar sin aplicar cupón si hay error
      }
    } else if (data.coupon_code && !data.customer_email) {
      console.warn(`⚠️ No se puede validar cupón sin email del cliente`);
    }

    // Validar que el total sea mayor a 0
    if (total_amount <= 0) {
      throw new Error("El total de la orden debe ser mayor a $0");
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear la orden
      const orderRepo = queryRunner.manager.getRepository(OrderEntity);
      
      // Determinar el estado inicial según si hay comprobante de pago
      const initialStatus = data.payment_receipt_url 
        ? "payment_pending_verification" 
        : "pending";
      
      const orderData: any = {
        id_client: data.id_client,
        id_cart: data.id_cart,
        id_payment_method: data.id_payment_method,
        delivery_type: data.delivery_type,
        total_amount,
        order_date: new Date(),
        status: initialStatus,
      };

      // Solo agregar payment_receipt_url si existe
      if (data.payment_receipt_url) {
        orderData.payment_receipt_url = data.payment_receipt_url;
      }

      // Agregar información del cupón si se aplicó
      if (coupon_code && discount_amount > 0) {
        orderData.coupon_code = coupon_code;
        orderData.discount_amount = discount_amount;
      }
      
      const newOrder = orderRepo.create(orderData);

      const savedOrderResult = await queryRunner.manager.save(OrderEntity, newOrder);
      const savedOrder = Array.isArray(savedOrderResult) ? savedOrderResult[0] : savedOrderResult;

      if (!savedOrder) {
        throw new Error("Error al guardar la orden");
      }

      // Si se proporcionan productOrders, crearlos en la tabla transaccional
      if (data.productOrders && data.productOrders.length > 0) {
        const productOrderRepo = queryRunner.manager.getRepository(ProductOrderEntity);
        const productRepo = queryRunner.manager.getRepository(ProductEntity);

        for (const item of data.productOrders) {
          // Verificar que el producto existe y tiene stock
          const product = await productRepo.findOne({
            where: { id_product: item.id_product },
          });

          if (!product) {
            throw new Error(`Producto con ID ${item.id_product} no encontrado`);
          }

          if (product.stock < item.quantity) {
            throw new Error(
              `⚠️ Stock insuficiente para "${product.product_name}". Disponible: ${product.stock} unidades, solicitado: ${item.quantity} unidades`
            );
          }

          // Validar que la cantidad sea positiva
          if (item.quantity <= 0) {
            throw new Error(`La cantidad debe ser mayor a 0 para el producto ${product.product_name}`);
          }

          // Validar que el precio sea positivo
          if (item.price_unit <= 0) {
            throw new Error(`El precio debe ser mayor a $0 para el producto ${product.product_name}`);
          }

          // Crear el ProductOrder
          const productOrder = productOrderRepo.create({
            id_order: savedOrder.id_order,
            id_product: item.id_product,
            price_unit: item.price_unit,
            subtotal: item.price_unit * item.quantity,
            created_at: new Date(),
          });

          await queryRunner.manager.save(ProductOrderEntity, productOrder);

          // Actualizar el stock del producto
          product.stock -= item.quantity;
          await queryRunner.manager.save(ProductEntity, product);
        }
      }

      await queryRunner.commitTransaction();

      // 🎟️ MARCAR CUPÓN COMO USADO si se aplicó
      if (coupon_code && discount_amount > 0) {
        try {
          const couponRepo = AppDataSource.getRepository(Coupon);
          await couponRepo.update(
            { code: coupon_code },
            { 
              used: true, 
              used_at: new Date(), 
              order_id: savedOrder.id_order 
            }
          );
          console.log(`✅ Cupón ${coupon_code} marcado como usado en orden ${savedOrder.id_order}`);
        } catch (error) {
          console.error('❌ Error al marcar cupón como usado:', error);
          // No fallar la orden si hay error al marcar el cupón
        }
      }

      // 💳 PROCESAR PAGO AUTOMÁTICO: Solo para tarjetas de crédito/débito
      // Obtener el método de pago para verificar si requiere procesamiento automático
      const paymentMethodRepo = AppDataSource.getRepository(PaymentMethodEntity);
      const selectedPaymentMethod = await paymentMethodRepo.findOne({
        where: { id_payment_method: data.id_payment_method }
      });

      const isCardPayment = selectedPaymentMethod?.method_name?.toLowerCase().includes('tarjeta');
      const isTransfer = selectedPaymentMethod?.method_name?.toLowerCase().includes('transferencia');

      if (isCardPayment) {
        // Procesar pago automáticamente con Payment Service
        console.log(`💳 Procesando pago con tarjeta para orden ${savedOrder.id_order}...`);
        
        const paymentResult = await processPayment({
          orderId: savedOrder.id_order,
          customerId: data.id_client,
          amount: total_amount,
          currency: "USD",
          description: `Orden #${savedOrder.id_order} - ${data.productOrders?.length || 0} producto(s)`,
          metadata: {
            delivery_type: data.delivery_type,
            payment_method_id: data.id_payment_method,
            items_count: data.productOrders?.length || 0
          }
        });

        // Actualizar orden con resultado del pago
        if (paymentResult.success) {
          await orderRepo.update(savedOrder.id_order, {
            status: "confirmed",
            payment_status: "paid",
            transaction_id: paymentResult.transactionId
          });
          savedOrder.status = "confirmed";
          (savedOrder as any).payment_status = "paid";
          (savedOrder as any).transaction_id = paymentResult.transactionId;
          
          console.log(`✅ Pago con tarjeta exitoso para orden ${savedOrder.id_order} - Transacción: ${paymentResult.transactionId}`);
        } else {
          await orderRepo.update(savedOrder.id_order, {
            status: "payment_failed",
            payment_status: "failed",
            payment_error: paymentResult.errorMessage || "Error desconocido"
          });
          savedOrder.status = "payment_failed";
          (savedOrder as any).payment_status = "failed";
          (savedOrder as any).payment_error = paymentResult.errorMessage || "Error desconocido";
          
          console.error(`❌ Pago con tarjeta fallido para orden ${savedOrder.id_order}: ${paymentResult.errorMessage}`);
        }
      } else {
        // Para efectivo, transferencia, etc. - NO procesar pago automáticamente
        console.log(`📋 Orden ${savedOrder.id_order} creada con método de pago manual (${selectedPaymentMethod?.method_name})`);
        // El estado ya fue establecido correctamente en initialStatus
        // No hacer nada más, dejar que el flujo manual siga
      }

      // Retornar la orden con sus productOrders
      const orderWithProducts = await orderRepo.findOne({
        where: { id_order: savedOrder.id_order },
        relations: ["productOrders", "productOrders.product"],
      });
      
      // Cargar manualmente el método de pago
      if (orderWithProducts && savedOrder.id_payment_method) {
        const paymentMethodRepo = queryRunner.manager.getRepository(PaymentMethodEntity);
        const paymentMethod = await paymentMethodRepo.findOne({
          where: { id_payment_method: savedOrder.id_payment_method }
        });
        if (paymentMethod) {
          (orderWithProducts as any).paymentMethod = paymentMethod;
        }
      }

      // 🔔 NOTIFICACIÓN: Enviar notificación de orden creada
      // Nota: Esto se hace DESPUÉS del commit para asegurar que la orden existe
      if (orderWithProducts) {
        // Obtener el seller_id del primer producto (asumiendo que todos son del mismo vendedor)
        const firstProduct = orderWithProducts.productOrders?.[0]?.product;
        const sellerId = firstProduct?.id_seller?.toString() || '';
        
        // Enviar notificación (async, no bloqueante)
        notifyOrderCreated(
          savedOrder.id_order,
          data.id_client.toString(),
          sellerId,
          {
            total_amount,
            status: savedOrder.status,
            delivery_type: savedOrder.delivery_type,
            products_count: data.productOrders?.length || 0
          }
        ).catch(err => {
          // Log del error pero no fallar el caso de uso
          console.error('Error sending order creation notification:', err);
        });

        // 📊 NOTIFICACIÓN DE ESTADÍSTICAS: Notificar actualización de stats
        // Esto hace que el frontend actualice las estadísticas en tiempo real
        if (sellerId) {
          notifySellerStatsUpdated(sellerId, {
            order_id: savedOrder.id_order,
            status: savedOrder.status,
            action: 'order_created'
          }).catch(err => console.error('Error notifying seller stats:', err));
        }
        
        // También notificar a admin
        notifyAdminStatsUpdated({
          order_id: savedOrder.id_order,
          status: savedOrder.status,
          action: 'order_created'
        }).catch(err => console.error('Error notifying admin stats:', err));
      }

      return orderWithProducts as unknown as Order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
