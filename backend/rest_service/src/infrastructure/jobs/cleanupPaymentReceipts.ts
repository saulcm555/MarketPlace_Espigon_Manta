import AppDataSource from "../database/data-source";
import { OrderEntity } from "../../models/orderModel";
import { LessThan, Not, IsNull } from "typeorm";
import { deleteFromSupabase, extractFilePathFromUrl } from "../storage/supabaseStorage";

/**
 * Limpieza automática de comprobantes de pago
 * 
 * Política de retención:
 * - 15 días: Eliminar comprobantes de órdenes NO verificadas (abandonadas)
 * - 60 días: Eliminar comprobantes de órdenes ya verificadas (completadas)
 */
export class PaymentReceiptCleanup {
  
  /**
   * Ejecuta la limpieza completa de comprobantes
   */
  static async execute(): Promise<void> {
    console.log('🧹 [CLEANUP] Iniciando limpieza de comprobantes de pago...');
    
    try {
      // 1. Limpiar comprobantes no verificados (15 días)
      const unverifiedCount = await this.cleanupUnverifiedReceipts();
      
      // 2. Limpiar comprobantes verificados antiguos (60 días)
      const verifiedCount = await this.cleanupVerifiedReceipts();
      
      console.log(`✅ [CLEANUP] Limpieza completada exitosamente`);
      console.log(`   - Comprobantes no verificados eliminados: ${unverifiedCount}`);
      console.log(`   - Comprobantes verificados eliminados: ${verifiedCount}`);
      console.log(`   - Total eliminados: ${unverifiedCount + verifiedCount}`);
      
    } catch (error) {
      console.error('❌ [CLEANUP] Error en la limpieza de comprobantes:', error);
      throw error;
    }
  }

  /**
   * Elimina comprobantes de órdenes no verificadas después de 15 días
   * Estados: payment_pending_verification
   */
  private static async cleanupUnverifiedReceipts(): Promise<number> {
    const RETENTION_DAYS = parseInt(process.env.UNVERIFIED_RETENTION_DAYS || '15');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    console.log(`📋 [CLEANUP] Buscando comprobantes no verificados (> ${RETENTION_DAYS} días)...`);

    const orderRepo = AppDataSource.getRepository(OrderEntity);

    // Buscar órdenes con comprobante pendiente de verificación
    const ordersToClean = await orderRepo.find({
      where: {
        payment_receipt_url: Not(IsNull()),
        status: 'payment_pending_verification',
        order_date: LessThan(cutoffDate)
      },
      select: ['id_order', 'payment_receipt_url', 'order_date', 'status']
    });

    let deletedCount = 0;

    for (const order of ordersToClean) {
      try {
        if (order.payment_receipt_url) {
          // Extraer la ruta del archivo de la URL
          const filePath = extractFilePathFromUrl(order.payment_receipt_url, 'payment-receipts');
          
          if (filePath) {
            // Eliminar de Supabase Storage
            const deleted = await deleteFromSupabase(filePath, 'payment-receipts');
            
            if (deleted) {
              // Actualizar la orden: limpiar URL y cambiar estado usando query builder
              await orderRepo
                .createQueryBuilder()
                .update(OrderEntity)
                .set({
                  payment_receipt_url: () => 'NULL',
                  status: 'expired'
                })
                .where("id_order = :id", { id: order.id_order })
                .execute();
              
              deletedCount++;
              console.log(`   ✓ Orden #${order.id_order}: Comprobante eliminado (${RETENTION_DAYS}+ días sin verificar)`);
            }
          }
        }
      } catch (error) {
        console.error(`   ✗ Error al procesar orden #${order.id_order}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Elimina comprobantes de órdenes verificadas después de 60 días
   * Estados: payment_confirmed, delivered
   */
  private static async cleanupVerifiedReceipts(): Promise<number> {
    const RETENTION_DAYS = parseInt(process.env.VERIFIED_RETENTION_DAYS || '60');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    console.log(`📋 [CLEANUP] Buscando comprobantes verificados (> ${RETENTION_DAYS} días)...`);

    const orderRepo = AppDataSource.getRepository(OrderEntity);

    // Buscar órdenes con pago verificado hace más de 60 días
    const ordersToClean = await orderRepo.find({
      where: {
        payment_receipt_url: Not(IsNull()),
        payment_verified_at: LessThan(cutoffDate),
        // Solo eliminar de órdenes completadas/entregadas
        status: 'delivered' // O también: In(['payment_confirmed', 'delivered'])
      },
      select: ['id_order', 'payment_receipt_url', 'payment_verified_at', 'status']
    });

    let deletedCount = 0;

    for (const order of ordersToClean) {
      try {
        if (order.payment_receipt_url) {
          // Extraer la ruta del archivo de la URL
          const filePath = extractFilePathFromUrl(order.payment_receipt_url, 'payment-receipts');
          
          if (filePath) {
            // Eliminar de Supabase Storage
            const deleted = await deleteFromSupabase(filePath, 'payment-receipts');
            
            if (deleted) {
              // Actualizar la orden: solo limpiar URL (mantener registro de orden) usando query builder
              await orderRepo
                .createQueryBuilder()
                .update(OrderEntity)
                .set({
                  payment_receipt_url: () => 'NULL'
                })
                .where("id_order = :id", { id: order.id_order })
                .execute();
              
              deletedCount++;
              console.log(`   ✓ Orden #${order.id_order}: Comprobante archivado (${RETENTION_DAYS}+ días verificado)`);
            }
          }
        }
      } catch (error) {
        console.error(`   ✗ Error al procesar orden #${order.id_order}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Obtiene estadísticas de comprobantes almacenados
   */
  static async getStats(): Promise<{
    totalReceipts: number;
    unverified: number;
    verified: number;
    expiredSoon: number;
  }> {
    const orderRepo = AppDataSource.getRepository(OrderEntity);

    const totalReceipts = await orderRepo.count({
      where: { payment_receipt_url: Not(IsNull()) }
    });

    const unverified = await orderRepo.count({
      where: {
        payment_receipt_url: Not(IsNull()),
        status: 'payment_pending_verification'
      }
    });

    const verified = await orderRepo.count({
      where: {
        payment_receipt_url: Not(IsNull()),
        payment_verified_at: Not(IsNull())
      }
    });

    // Comprobantes que expirarán pronto (próximos 3 días)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - 12); // 15 - 3 = 12 días

    const expiredSoon = await orderRepo.count({
      where: {
        payment_receipt_url: Not(IsNull()),
        status: 'payment_pending_verification',
        order_date: LessThan(expirationDate)
      }
    });

    return {
      totalReceipts,
      unverified,
      verified,
      expiredSoon
    };
  }
}
