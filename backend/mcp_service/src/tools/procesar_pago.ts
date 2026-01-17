/**
 * MCP Tool: procesar_pago
 * 
 * Herramienta MCP para procesar pagos desde el chatbot.
 * Invoca el Payment Service de forma segura.
 * 
 * @module tools/procesar_pago
 */

import { getPaymentClient, ProcessPaymentRequest, ProcessPaymentResponse } from '../clients/PaymentClient';

/**
 * Definición del MCP Tool
 */
export const procesarPagoTool = {
  name: 'procesar_pago',
  description: 'Procesa el pago de una orden del marketplace. Usa esta herramienta cuando el usuario quiera pagar una orden o confirmar un pago.',
  
  parameters: {
    type: 'object',
    properties: {
      orderId: {
        type: 'number',
        description: 'ID de la orden a pagar'
      },
      amount: {
        type: 'number',
        description: 'Monto a cobrar en la moneda especificada'
      },
      currency: {
        type: 'string',
        description: 'Código de moneda ISO 4217 (ej: USD, EUR)',
        default: 'USD'
      },
      description: {
        type: 'string',
        description: 'Descripción opcional del pago'
      }
    },
    required: ['orderId', 'amount']
  },

  /**
   * Ejecutar el pago
   */
  async execute(params: {
    orderId: number;
    amount: number;
    currency?: string;
    description?: string;
  }): Promise<ProcessPaymentResponse> {
    console.log(`🔧 [Tool:procesar_pago] Procesando pago para orden #${params.orderId}`);

    const client = getPaymentClient();

    const request: ProcessPaymentRequest = {
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency || 'USD',
      description: params.description || `Pago de orden #${params.orderId}`,
      metadata: {
        source: 'mcp_chatbot',
        tool: 'procesar_pago'
      }
    };

    const result = await client.processPayment(request);

    if (result.success) {
      console.log(`✅ [Tool:procesar_pago] Pago exitoso: ${result.transactionId}`);
    } else {
      console.log(`❌ [Tool:procesar_pago] Pago fallido: ${result.errorMessage}`);
    }

    return result;
  },

  /**
   * Formatear respuesta para el usuario
   */
  formatResponse(result: ProcessPaymentResponse): string {
    if (result.success) {
      return `✅ ¡Pago procesado exitosamente!\n\n` +
             `📋 **Detalles:**\n` +
             `- Transacción: \`${result.transactionId}\`\n` +
             `- Monto: $${result.amount} ${result.currency}\n` +
             `- Estado: ${result.status}`;
    } else {
      return `❌ No se pudo procesar el pago.\n\n` +
             `**Razón:** ${result.errorMessage || 'Error desconocido'}\n\n` +
             `Por favor, intenta de nuevo o contacta soporte.`;
    }
  }
};

/**
 * Función helper para uso directo
 */
export async function procesarPago(
  orderId: number,
  amount: number,
  currency: string = 'USD'
): Promise<ProcessPaymentResponse> {
  return procesarPagoTool.execute({ orderId, amount, currency });
}

export default procesarPagoTool;
