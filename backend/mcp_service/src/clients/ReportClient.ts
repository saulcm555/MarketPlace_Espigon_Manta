/**
 * Report Client - Cliente HTTP para Report Service (GraphQL)
 * 
 * Ejecuta queries GraphQL contra el Report Service
 */

import axios, { AxiosInstance } from 'axios';

// ============================================
// TYPES
// ============================================

export interface TopSeller {
  seller_id: number;
  seller_name: string;
  total_sales: number;
  total_orders: number;
}

export interface TopSellersReport {
  top_sellers: TopSeller[];
}

export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

// ============================================
// CLIENT
// ============================================

export class ReportClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.REPORT_SERVICE_URL || 'http://localhost:4000';
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Ejecutar query GraphQL genérica
   */
  async executeGraphQLQuery<T>(query: string, variables: Record<string, any> = {}): Promise<GraphQLResponse<T>> {
    try {
      const response = await this.client.post('/graphql', {
        query,
        variables
      });

      if (response.data.errors && response.data.errors.length > 0) {
        throw new Error(response.data.errors[0].message);
      }

      return response.data;
    } catch (error: any) {
      console.error('[ReportClient] Error ejecutando query:', error.message);
      throw new Error(`Error en Report Service: ${error.message}`);
    }
  }

  /**
   * Obtener reporte de top vendedores
   */
  async getTopSellersReport(startDate: string, endDate: string, limit: number = 5): Promise<TopSellersReport> {
    const query = `
      query TopSellers($startDate: String!, $endDate: String!, $limit: Int) {
        top_sellers_report(
          date_range: { start_date: $startDate, end_date: $endDate }
          limit: $limit
        ) {
          top_sellers {
            seller_id
            seller_name
            total_sales
            total_orders
          }
        }
      }
    `;

    const response = await this.executeGraphQLQuery<{ top_sellers_report: TopSellersReport }>(query, {
      startDate,
      endDate,
      limit
    });

    return response.data.top_sellers_report;
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'error' };
    }
  }
}

// Singleton
let reportClientInstance: ReportClient | null = null;

export function getReportClient(): ReportClient {
  if (!reportClientInstance) {
    reportClientInstance = new ReportClient();
  }
  return reportClientInstance;
}
