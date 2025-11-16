import { Request, Response } from "express";
import AppDataSource from "../../../infrastructure/database/data-source";
import { SellerEntity } from "../../../models/sellerModel";
import { ProductEntity } from "../../../models/productModel";

/**
 * Obtener estadísticas generales del marketplace
 * @route GET /statistics
 * @access Public
 */
export const getStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const sellerRepository = AppDataSource.getRepository(SellerEntity);
    const productRepository = AppDataSource.getRepository(ProductEntity);

    // Contar todos los vendedores registrados
    const totalSellers = await sellerRepository.count();

    // Contar todos los productos activos
    const totalProducts = await productRepository.count();

    res.status(200).json({
      success: true,
      data: {
        sellers: totalSellers,
        products: totalProducts,
        local: 100 // Valor fijo que representa 100% local
      }
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas del marketplace"
    });
  }
};

/**
 * Obtener estadísticas del dashboard del vendedor (OPTIMIZADO)
 * @route GET /statistics/seller/:sellerId/dashboard
 * @access Protected (Service token o autenticado)
 */
export const getSellerDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestStart = Date.now();
    const sellerId = parseInt(req.params.sellerId || "0");
    
    if (isNaN(sellerId) || sellerId === 0) {
      res.status(400).json({ error: "seller_id inválido" });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Query SQL ÚNICA optimizada - combina todo en una sola query
    const queryStart = Date.now();
    const result = await AppDataSource.query(`
      SELECT
        -- Estadísticas de ventas y órdenes
        COALESCE(SUM(CASE 
          WHEN DATE(o.order_date) = CURRENT_DATE AND o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed')
          THEN po.subtotal 
          ELSE 0 
        END), 0) as today_sales,
        
        COUNT(DISTINCT CASE 
          WHEN DATE(o.order_date) = CURRENT_DATE AND o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed')
          THEN o.id_order 
        END) as today_orders,
        
        COALESCE(SUM(CASE 
          WHEN o.order_date >= $2::timestamp AND o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed')
          THEN po.subtotal 
          ELSE 0 
        END), 0) as month_revenue,
        
        COUNT(DISTINCT CASE 
          WHEN o.order_date >= $2::timestamp AND o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed')
          THEN o.id_order 
        END) as month_orders,
        
        COALESCE(SUM(CASE WHEN o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed') THEN po.subtotal ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT CASE WHEN o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed') THEN o.id_order END) as total_orders,
        COUNT(DISTINCT CASE WHEN o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing') THEN o.id_order END) as pending_orders,
        
        -- Estadísticas de productos (calculadas en la misma query)
        COUNT(DISTINCT p.id_product) as total_products,
        COUNT(DISTINCT CASE WHEN p.stock < 10 THEN p.id_product END) as low_stock_products
        
      FROM product p
      LEFT JOIN product_order po ON po.id_product = p.id_product
      LEFT JOIN "order" o ON po.id_order = o.id_order
      WHERE p.id_seller = $1
    `, [sellerId, firstDayOfMonth]);
    const queryTime = Date.now() - queryStart;
    
    const statsResult = {
      seller_id: sellerId,
      today_sales: parseFloat(result[0].today_sales || 0),
      today_orders: parseInt(result[0].today_orders || 0),
      month_revenue: parseFloat(result[0].month_revenue || 0),
      month_orders: parseInt(result[0].month_orders || 0),
      total_products: parseInt(result[0].total_products || 0),
      low_stock_products: parseInt(result[0].low_stock_products || 0),
      total_revenue: parseFloat(result[0].total_revenue || 0),
      total_orders: parseInt(result[0].total_orders || 0),
      pending_orders: parseInt(result[0].pending_orders || 0),
    };

    const totalTime = Date.now() - requestStart;
    console.log(`📊 [STATS] Seller ${sellerId} dashboard:`, statsResult);
    console.log(`⏱️ [STATS] TOTAL TIME for seller ${sellerId}: ${totalTime}ms (Single Query: ${queryTime}ms)`);
    res.json(statsResult);
  } catch (error) {
    console.error("Error getting seller dashboard stats:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};

/**
 * Obtener estadísticas del dashboard de administrador (OPTIMIZADO)
 * @route GET /statistics/admin/dashboard
 * @access Protected (Admin only)
 */
export const getAdminDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Query SQL optimizado
    const stats = await AppDataSource.query(`
      SELECT
        COALESCE(SUM(CASE 
          WHEN DATE(o.order_date) = CURRENT_DATE AND o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed')
          THEN o.total_amount 
          ELSE 0 
        END), 0) as today_sales,
        
        COUNT(DISTINCT CASE 
          WHEN DATE(o.order_date) = CURRENT_DATE AND o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed')
          THEN o.id_order 
        END) as today_orders,
        
        COALESCE(SUM(CASE 
          WHEN o.order_date >= $1::timestamp AND o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed')
          THEN o.total_amount 
          ELSE 0 
        END), 0) as month_revenue,
        
        COUNT(DISTINCT CASE 
          WHEN o.order_date >= $1::timestamp AND o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed')
          THEN o.id_order 
        END) as month_orders,
        
        COUNT(DISTINCT CASE 
          WHEN o.status IN ('processing', 'pending')
          THEN o.id_order 
        END) as pending_deliveries
        
      FROM "order" o
    `, [firstDayOfMonth]);

    // Contadores adicionales
    const counters = await AppDataSource.query(`
      SELECT
        (SELECT COUNT(*) FROM client) as total_active_clients,
        (SELECT COUNT(*) FROM seller) as total_active_sellers,
        (SELECT COUNT(*) FROM product) as total_products,
        (SELECT COUNT(*) FROM product WHERE stock < 10) as low_stock_products
    `);

    const result = {
      today_sales: parseFloat(stats[0].today_sales || 0),
      today_orders: parseInt(stats[0].today_orders || 0),
      total_active_clients: parseInt(counters[0].total_active_clients || 0),
      total_active_sellers: parseInt(counters[0].total_active_sellers || 0),
      total_products: parseInt(counters[0].total_products || 0),
      pending_deliveries: parseInt(stats[0].pending_deliveries || 0),
      low_stock_products: parseInt(counters[0].low_stock_products || 0),
      month_revenue: parseFloat(stats[0].month_revenue || 0),
      month_orders: parseInt(stats[0].month_orders || 0),
    };

    res.json(result);
  } catch (error) {
    console.error("Error getting admin dashboard stats:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};

/**
 * Obtener mejores productos del vendedor (OPTIMIZADO)
 * @route GET /statistics/seller/:sellerId/best-products
 * @access Protected (Service token o autenticado)
 */
export const getSellerBestProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const sellerId = parseInt(req.params.sellerId || "0");
    const limit = parseInt(req.query.limit as string || "10");
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    if (isNaN(sellerId) || sellerId === 0) {
      res.status(400).json({ error: "seller_id inválido" });
      return;
    }

    // Query SQL optimizada con JOINs y agregaciones
    let query = `
      SELECT 
        p.id_product,
        p.product_name,
        COALESCE(c.category_name, 'Sin categoría') as category_name,
        COALESCE(COUNT(po.id_product_order), 0) as units_sold,
        COALESCE(SUM(po.subtotal), 0) as total_revenue,
        COALESCE(AVG(po.price_unit), 0) as average_price
      FROM product_order po
      INNER JOIN product p ON po.id_product = p.id_product
      LEFT JOIN category c ON p.id_category = c.id_category
      INNER JOIN "order" o ON po.id_order = o.id_order
      WHERE p.id_seller = $1
        AND o.status IN ('pending', 'payment_pending_verification', 'payment_confirmed', 'processing', 'shipped', 'delivered', 'completed')
    `;

    const params: any[] = [sellerId];

    if (startDate && endDate) {
      query += ` AND DATE(o.order_date) BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
      query += `
      GROUP BY p.id_product, p.product_name, c.category_name
      ORDER BY units_sold DESC
      LIMIT $4`;
      params.push(limit);
    } else {
      query += `
      GROUP BY p.id_product, p.product_name, c.category_name
      ORDER BY units_sold DESC
      LIMIT $2`;
      params.push(limit);
    }

    const result = await AppDataSource.query(query, params);

    const products = result.map((row: any) => ({
      product_id: parseInt(row.id_product),
      product_name: row.product_name,
      category_name: row.category_name,
      units_sold: parseInt(row.units_sold || 0),
      total_revenue: parseFloat(parseFloat(row.total_revenue || 0).toFixed(2)),
      average_price: parseFloat(parseFloat(row.average_price || 0).toFixed(2))
    }));

    res.json({
      best_products: products
    });
  } catch (error) {
    console.error("Error getting seller best products:", error);
    res.status(500).json({ error: "Error al obtener mejores productos" });
  }
};
