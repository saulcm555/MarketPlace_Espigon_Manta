import { gql } from '@apollo/client';

export const DASHBOARD_STATS = gql`
  query DashboardStats {
    dashboard_stats {
      today_sales
      today_orders
      total_active_clients
      total_active_sellers
      total_products
      pending_deliveries
      low_stock_products
      month_revenue
      month_orders
    }
  }
`;

export const SALES_REPORT = gql`
  query SalesReport($dateRange: DateRangeInput, $period: ReportPeriod!) {
    sales_report(date_range: $dateRange, period: $period) {
      start_date
      end_date
      total_revenue
      total_orders
      average_order_value
      sales_by_period {
        period
        total_sales
        total_orders
        average_order_value
      }
    }
  }
`;

export const CLIENTS_REPORT = gql`
  query ClientsReport($dateRange: DateRangeInput) {
    clients_report(date_range: $dateRange) {
      period_start
      period_end
      total_clients
      new_clients
      active_clients
      top_clients {
        client_id
        client_name
        client_email
        total_orders
        total_spent
        last_order_date
      }
    }
  }
`;
