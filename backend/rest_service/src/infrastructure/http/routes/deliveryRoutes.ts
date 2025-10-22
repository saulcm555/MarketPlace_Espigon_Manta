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

// Rutas protegidas (solo admin/seller)
router.post("/", authMiddleware, createDelivery);
router.put("/:id", authMiddleware, updateDelivery);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteDelivery);

export default router;
