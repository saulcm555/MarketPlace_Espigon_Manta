import { Router } from 'express';
import { 
  generateCategorySalesReportPDF, 
  generateInventoryReportPDF,
  generateTopSellersReportPDF,
  generateBestProductsReportPDF,
  generateDeliveryPerformanceReportPDF
} from '../../http/controllers/reportsController';

const router = Router();

/**
 * @route GET /reports/category-sales/pdf
 * @desc Generate PDF report for category sales
 * @access Public (puede protegerse con authMiddleware después)
 */
router.get('/category-sales/pdf', generateCategorySalesReportPDF);

/**
 * @route GET /reports/inventory/pdf
 * @desc Generate PDF report for inventory
 * @access Public (puede protegerse con authMiddleware después)
 */
router.get('/inventory/pdf', generateInventoryReportPDF);

/**
 * @route GET /reports/top-sellers/pdf
 * @desc Generate PDF report for top sellers
 * @access Public
 */
router.get('/top-sellers/pdf', generateTopSellersReportPDF);

/**
 * @route GET /reports/best-products/pdf
 * @desc Generate PDF report for best products
 * @access Public
 */
router.get('/best-products/pdf', generateBestProductsReportPDF);

/**
 * @route GET /reports/delivery-performance/pdf
 * @desc Generate PDF report for delivery performance
 * @access Public
 */
router.get('/delivery-performance/pdf', generateDeliveryPerformanceReportPDF);

export default router;
