/**
 * API functions for marketplace statistics
 */
import apiClient from './client';

export interface Statistics {
  sellers: number;
  products: number;
  local: number;
}

export interface StatisticsResponse {
  success: boolean;
  data: Statistics;
}

/**
 * Get marketplace statistics (sellers count, products count, etc.)
 */
export const getStatistics = async (): Promise<Statistics> => {
  const response = await apiClient.get<StatisticsResponse>('/statistics');
  return response.data.data;
};
