/**
 * MCP Tool: consultar_pago
 * 
 * Herramienta MCP para consultar el estado de un pago.
 * 
 * @module tools/consultar_pago
 */

import { getPaymentClient, TransactionDTO } from '../clients/PaymentClient';

/**
 * Definición del MCP Tool
 */
export const consultarPagoTool = {
  name: 'consultar_pago',
  description: 'Consulta el estado de un pago o transacción. Usa esta herramienta cuando el usuario pregunte por el estado de un pago.',
  
  parameters: {
    type: 'object',
    properties: {
      transactionId: {
        type: 'string',
        description: 'ID de la transacción a consultar (ej: mock_txn_123456)'
      }
    },
    required: ['transactionId']
  },

  /**
   * Ejecutar la consulta
   */
  async execute(params: { transactionId: string }): Promise<TransactionDTO | { error: string }> {
    console.log(`🔧 [Tool:consultar_pago] Consultando transacción: ${params.transactionId}`);

    const client = getPaymentClient();
    const transaction = await client.getTransaction(params.transactionId);

    if (!transaction) {
      console.log(`❌ [Tool:consultar_pago] Transacción no encontrada`);
      return { error: 'Transacción no encontrada' };
    }

    console.log(`✅ [Tool:consultar_pago] Transacción encontrada: ${transaction.status}`);
    return transaction;
  },

  /**
   * Formatear respuesta para el usuario
   */
  formatResponse(result: TransactionDTO | { error: string }): string {
    if ('error' in result) {
      return `❌ ${result.error}`;
    }

    const statusEmoji: Record<string, string> = {
      'completed': '✅',
      'pending': '⏳',
      'failed': '❌',
      'refunded': '💰'
    };

    return `📋 **Información de la Transacción**\n\n` +
           `- ID: \`${result.transaction_id}\`\n` +
           `- Estado: ${statusEmoji[result.status] || '❓'} ${result.status}\n` +
           `- Monto: $${result.amount} ${result.currency}\n` +
           `- Proveedor: ${result.provider}\n` +
           `- Fecha: ${result.created_at}` +
           (result.order_id ? `\n- Orden: #${result.order_id}` : '');
  }
};

export default consultarPagoTool;
