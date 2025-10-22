import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../controllers/paymentMethodController";

const router = Router();

// Rutas públicas (solo lectura)
router.get("/", getPaymentMethods);
router.get("/:id", getPaymentMethodById);

// Rutas protegidas (solo admin)
router.post("/", authMiddleware, roleMiddleware("admin"), createPaymentMethod);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updatePaymentMethod);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deletePaymentMethod);

export default router;
