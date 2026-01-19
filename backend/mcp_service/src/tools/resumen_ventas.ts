/**
 * MCP Tool: resumen_ventas
 * 
 * Obtiene un resumen de ventas de los top vendedores.
 * Query GraphQL: top_sellers_report (Report Service)
 */

import { getReportClient, TopSeller } from '../clients/ReportClient';

// ============================================
// TYPES
// ============================================

export interface ResumenVentasParams {
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  limit?: number;
}

export interface ResumenVentasResult {
  success: boolean;
  topSellers: TopSeller[];
  period?: {
    start: string;
    end: string;
  };
  error?: string;
}

// ============================================
// TOOL DEFINITION
// ============================================

export const resumenVentasTool = {
  name: 'resumen_ventas',
  description: 'Obtiene un resumen de ventas de los top vendedores. Usa el query top_sellers_report del Report Service (GraphQL).',
  parameters: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        description: 'Fecha inicio del período (YYYY-MM-DD)'
      },
      endDate: {
        type: 'string',
        description: 'Fecha fin del período (YYYY-MM-DD)'
      },
      limit: {
        type: 'number',
        description: 'Número de top vendedores a mostrar (default: 5)'
      }
    },
    required: ['startDate', 'endDate']
  },

  /**
   * Ejecutar consulta de resumen de ventas
   */
  async execute(params: ResumenVentasParams): Promise<ResumenVentasResult> {
    try {
      const client = getReportClient();

      const report = await client.getTopSellersReport(
        params.startDate,
        params.endDate,
        params.limit || 5
      );

      return {
        success: true,
        topSellers: report.top_sellers || [],
        period: {
          start: params.startDate,
          end: params.endDate
        }
      };
    } catch (error: any) {
      return {
        success: false,
        topSellers: [],
        error: error.message
      };
    }
  },

  /**
   * Formatear respuesta para el usuario
   */
  formatResponse(result: ResumenVentasResult): string {
    if (!result.success) {
      return `❌ Error al obtener resumen de ventas: ${result.error}`;
    }

    if (result.topSellers.length === 0) {
      return '📊 No hay datos de ventas para el período seleccionado.';
    }

    let response = `📊 **Top Vendedores**\n`;
    response += `📅 Período: ${result.period?.start} al ${result.period?.end}\n\n`;

    result.topSellers.forEach((seller, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆';
      response += `${medal} **${seller.seller_name}**\n`;
      response += `   💰 Ventas totales: $${seller.total_sales.toFixed(2)}\n`;
      response += `   📦 Órdenes: ${seller.total_orders}\n\n`;
    });

    return response;
  }
};

/**
 * Función helper para ejecutar directamente
 */
export async function resumenVentas(params: ResumenVentasParams): Promise<ResumenVentasResult> {
  return resumenVentasTool.execute(params);
}
