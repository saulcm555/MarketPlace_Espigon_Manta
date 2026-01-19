/**
 * MCP Tool: crear_orden
 * 
 * Crea una orden de compra en el marketplace.
 * Endpoint: POST /api/orders (Rest Service)
 * Autenticación: Requiere Bearer token (rol client)
 */

import { getOrderClient, CreateOrderRequest, OrderItem } from '../clients/OrderClient';

// ============================================
// TYPES
// ============================================

export interface CrearOrdenParams {
  clientId: number;
  products: Array<{
    productId: number;
    quantity: number;
  }>;
  shippingAddress?: string;
  notes?: string;
}

export interface CrearOrdenResult {
  success: boolean;
  orderId?: number;
  total?: number;
  status?: string;
  error?: string;
}

// ============================================
// TOOL DEFINITION
// ============================================

export const crearOrdenTool = {
  name: 'crear_orden',
  description: 'Crea una orden de compra. Requiere autenticación del cliente. Endpoint: POST /api/orders del Rest Service.',
  parameters: {
    type: 'object',
    properties: {
      clientId: {
        type: 'number',
        description: 'ID del cliente que realiza la orden'
      },
      products: {
        type: 'array',
        description: 'Lista de productos a comprar',
        items: {
          type: 'object',
          properties: {
            productId: { type: 'number', description: 'ID del producto' },
            quantity: { type: 'number', description: 'Cantidad a comprar' }
          },
          required: ['productId', 'quantity']
        }
      },
      shippingAddress: {
        type: 'string',
        description: 'Dirección de envío'
      },
      notes: {
        type: 'string',
        description: 'Notas adicionales para la orden'
      }
    },
    required: ['clientId', 'products']
  },

  /**
   * Ejecutar creación de orden
   */
  async execute(params: CrearOrdenParams): Promise<CrearOrdenResult> {
    try {
      const client = getOrderClient();

      const items: OrderItem[] = params.products.map(p => ({
        id_product: p.productId,
        quantity: p.quantity
      }));

      const orderData: CreateOrderRequest = {
        id_client: params.clientId,
        items,
        shipping_address: params.shippingAddress,
        notes: params.notes
      };

      const order = await client.createOrder(orderData);

      return {
        success: true,
        orderId: order.id_order,
        total: order.total_amount,
        status: order.order_status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Formatear respuesta para el usuario
   */
  formatResponse(result: CrearOrdenResult): string {
    if (!result.success) {
      return `❌ Error al crear orden: ${result.error}`;
    }

    return `✅ **Orden creada exitosamente!**\n` +
           `🆔 ID de Orden: #${result.orderId}\n` +
           `💵 Total: $${result.total?.toFixed(2) || '0.00'}\n` +
           `📦 Estado: ${result.status || 'pendiente'}`;
  }
};

/**
 * Función helper para ejecutar directamente
 */
export async function crearOrden(params: CrearOrdenParams): Promise<CrearOrdenResult> {
  return crearOrdenTool.execute(params);
}
