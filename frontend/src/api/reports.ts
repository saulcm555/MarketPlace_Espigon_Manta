import apiClient from './client';

/**
 * API para reportes en PDF
 */

export const reportsApi = {
  /**
   * Genera reporte PDF de ventas por categoría
   * @param startDate Fecha inicio (YYYY-MM-DD)
   * @param endDate Fecha fin (YYYY-MM-DD)
   * @returns URL del PDF generado
   */
  generateCategorySalesReport: async (startDate: string, endDate: string): Promise<string> => {
    const response = await apiClient.get(
      `/reports/category-sales/pdf?start_date=${startDate}&end_date=${endDate}`,
      { responseType: 'blob' }
    );

    // Crear URL del blob para abrir en nueva pestaña
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    return url;
  },

  /**
   * Genera reporte PDF de inventario
   * @param threshold Umbral de stock bajo (default 10)
   * @returns URL del PDF generado
   */
  generateInventoryReport: async (threshold: number = 10): Promise<string> => {
    const response = await apiClient.get(
      `/reports/inventory/pdf?threshold=${threshold}`,
      { responseType: 'blob' }
    );

    // Crear URL del blob para abrir en nueva pestaña
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    return url;
  },

  /**
   * Genera reporte PDF de top vendedores
   * @param startDate Fecha inicio (YYYY-MM-DD)
   * @param endDate Fecha fin (YYYY-MM-DD)
   * @param limit Número de vendedores a mostrar (default 10)
   * @returns URL del PDF generado
   */
  generateTopSellersReport: async (startDate: string, endDate: string, limit: number = 10): Promise<string> => {
    const response = await apiClient.get(
      `/reports/top-sellers/pdf?start_date=${startDate}&end_date=${endDate}&limit=${limit}`,
      { responseType: 'blob' }
    );

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    return url;
  },

  /**
   * Genera reporte PDF de mejores productos
   * @param startDate Fecha inicio (YYYY-MM-DD)
   * @param endDate Fecha fin (YYYY-MM-DD)
   * @param limit Número de productos a mostrar (default 10)
   * @returns URL del PDF generado
   */
  generateBestProductsReport: async (startDate: string, endDate: string, limit: number = 10): Promise<string> => {
    const response = await apiClient.get(
      `/reports/best-products/pdf?start_date=${startDate}&end_date=${endDate}&limit=${limit}`,
      { responseType: 'blob' }
    );

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    return url;
  },

  /**
   * Genera reporte PDF de rendimiento de entregas
   * @param startDate Fecha inicio (YYYY-MM-DD)
   * @param endDate Fecha fin (YYYY-MM-DD)
   * @returns URL del PDF generado
   */
  generateDeliveryPerformanceReport: async (startDate: string, endDate: string): Promise<string> => {
    const response = await apiClient.get(
      `/reports/delivery-performance/pdf?start_date=${startDate}&end_date=${endDate}`,
      { responseType: 'blob' }
    );

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    return url;
  },
};

