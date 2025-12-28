import { gql } from '@apollo/client';

export const CATEGORY_SALES_REPORT = gql`
  query CategorySalesReport($dateRange: DateRangeInput) {
    category_sales_report(date_range: $dateRange) {
      period_start
      period_end
      categories {
        category_id
        category_name
        total_sales
        total_orders
        products_count
      }
    }
  }
`;

export const INVENTORY_REPORT = gql`
  query InventoryReport($threshold: Int!) {
    inventory_report(min_stock_threshold: $threshold) {
      total_products
      out_of_stock
      low_stock
      critical_products {
        product_id
        product_name
        seller_name
        current_stock
        min_stock_threshold
        status
      }
    }
  }
`;

export const TOP_SELLERS_REPORT = gql`
  query TopSellersReport($dateRange: DateRangeInput, $limit: Int) {
    top_sellers_report(date_range: $dateRange, limit: $limit) {
      period_start
      period_end
      top_sellers {
        seller_id
        seller_name
        business_name
        total_sales
        total_orders
        products_sold
      }
    }
  }
`;

export const BEST_PRODUCTS_REPORT = gql`
  query BestProductsReport($dateRange: DateRangeInput, $limit: Int) {
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

export const DELIVERY_PERFORMANCE_REPORT = gql`
  query DeliveryPerformanceReport($dateRange: DateRangeInput) {
    delivery_performance_report(date_range: $dateRange) {
      period_start
      period_end
      total_deliveries
      completed
      pending
      cancelled
      average_delivery_time_hours
      status_breakdown {
        status
        count
        percentage
      }
    }
  }
`;
