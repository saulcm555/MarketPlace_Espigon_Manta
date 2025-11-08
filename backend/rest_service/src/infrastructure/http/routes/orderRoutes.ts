import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createOrderValidation,
  updateOrderValidation,
  getOrderByIdValidation
} from "../../middlewares/validations/orderValidations";
import { getOrders, getOrderById, createOrder, updateOrder, deleteOrder, addReview, getProductReviews } from "../controllers/orderController";

const router = Router();

router.get("/", authMiddleware, roleMiddleware("admin"), getOrders); // Solo admin ve todas
router.get("/:id", getOrderByIdValidation, validateRequest, authMiddleware, getOrderById); // Cliente ve su orden
router.post("/", createOrderValidation, validateRequest, authMiddleware, roleMiddleware("client"), createOrder); // Solo cliente crea orden
router.put("/:id", getOrderByIdValidation, updateOrderValidation, validateRequest, authMiddleware, roleMiddleware("admin"), updateOrder); // Solo admin actualiza
router.delete("/:id", getOrderByIdValidation, validateRequest, authMiddleware, roleMiddleware("admin"), deleteOrder); // Solo admin elimina

// Rutas para reseñas
router.post("/product-order/:id_product_order/review", authMiddleware, roleMiddleware("client"), addReview); // Cliente agrega reseña
router.get("/products/:id_product/reviews", getProductReviews); // Público - obtener reseñas de un producto

export default router;
