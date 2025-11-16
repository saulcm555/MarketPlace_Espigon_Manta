import { Router } from "express";
import { getStatistics, getSellerDashboardStats, getAdminDashboardStats, getSellerBestProducts } from "../controllers/statisticsController";
import { serviceTokenMiddleware } from "../middlewares/serviceToken";

const router = Router();

// Ruta pública para obtener estadísticas del marketplace
router.get("/", getStatistics);

// Rutas protegidas para servicios internos (report_service)
router.get("/seller/:sellerId/dashboard", serviceTokenMiddleware, getSellerDashboardStats);
router.get("/seller/:sellerId/best-products", serviceTokenMiddleware, getSellerBestProducts);
router.get("/admin/dashboard", serviceTokenMiddleware, getAdminDashboardStats);

export default router;
