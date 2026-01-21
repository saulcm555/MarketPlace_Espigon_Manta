/**
 * Queries GraphQL para analíticas del vendedor
 */
import { gql } from '@apollo/client';

export const GET_SELLER_DASHBOARD_STATS = gql`
  query GetSellerDashboardStats($sellerId: String!) {
    seller_dashboard_stats(seller_id: $sellerId) {
      seller_id
      today_sales
      today_orders
      month_revenue
      month_orders
      total_products
      low_stock_products
      total_revenue
      total_orders
      pending_orders
    }
  }
`;

export const GET_SELLER_BEST_PRODUCTS = gql`
  query GetSellerBestProducts($sellerId: String!, $dateRange: DateRangeInput, $limit: Int) {
    seller_best_products(seller_id: $sellerId, date_range: $dateRange, limit: $limit) {
      period_start
      period_end
      best_products {
        product_id
        product_name
        category_name
        units_sold
        total_revenue
        average_price
      }
    }
  }
`;

// Queries globales (no se usan en el panel del vendedor)
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboard_stats {
      today_sales
      today_orders
      month_revenue
      month_orders
      total_products
      total_active_clients
      total_active_sellers
      pending_deliveries
      low_stock_products
    }
  }
`;

export const GET_BEST_PRODUCTS = gql`
  query GetBestProducts($dateRange: DateRangeInput, $limit: Int) {
    best_products_report(date_range: $dateRange, limit: $limit) {
      period_start
      period_end
      best_products {
        product_id
        product_name
        category_name
        units_sold
        total_revenue
        average_price
      }
    }
  }
`;

export const GET_CATEGORY_SALES = gql`
  query GetCategorySales($dateRange: DateRangeInput) {
    category_sales_report(date_range: $dateRange) {
      start_date
      end_date
      total_categories
      categories {
        category_id
        category_name
        total_sales
        total_revenue
        products_sold
        percentage_of_total
      }
    }
  }
`;
