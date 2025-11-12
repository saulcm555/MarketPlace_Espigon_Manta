import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery,
} from "../controllers/deliveryController";

const router = Router();

// Rutas públicas (solo lectura)
router.get("/", getDeliveries);
router.get("/:id", getDeliveryById);

// Rutas protegidas (solo admin)
router.post("/", authMiddleware, roleMiddleware("admin"), createDelivery);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateDelivery);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteDelivery);

export default router;
