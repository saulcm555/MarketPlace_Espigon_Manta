import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { getProductOrders } from "../controllers/orderController";

const router = Router();

// Ruta para obtener todos los product_orders (solo para reportes internos y admin)
router.get("/", authMiddleware, roleMiddleware(["admin", "service"]), getProductOrders);

export default router;
