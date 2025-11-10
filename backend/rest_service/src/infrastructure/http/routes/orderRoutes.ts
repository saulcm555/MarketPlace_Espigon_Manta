import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createOrderValidation,
  updateOrderValidation,
  getOrderByIdValidation
} from "../../middlewares/validations/orderValidations";
import { 
  getOrders, 
  getOrderById, 
  createOrder, 
  updateOrder, 
  deleteOrder, 
  addReview, 
  getProductReviews,
  updatePaymentReceipt,
  verifyPayment,
  getSellerPendingPayments,
  getSellerOrders,
  getMyOrders
} from "../controllers/orderController";

const router = Router();

router.get("/", authMiddleware, roleMiddleware("admin"), getOrders); // Solo admin ve todas
router.get("/my-orders", authMiddleware, roleMiddleware("client"), getMyOrders); // Cliente ve sus órdenes

// Rutas específicas del vendedor (ANTES de /:id para evitar conflictos)
router.get("/seller/pending-payments", authMiddleware, roleMiddleware("seller"), getSellerPendingPayments); // Vendedor ve pagos pendientes
router.get("/seller/orders", authMiddleware, roleMiddleware("seller"), getSellerOrders); // Vendedor ve todos sus pedidos

router.get("/:id", getOrderByIdValidation, validateRequest, authMiddleware, getOrderById); // Cliente ve su orden
router.post("/", createOrderValidation, validateRequest, authMiddleware, roleMiddleware("client"), createOrder); // Solo cliente crea orden
router.put("/:id", getOrderByIdValidation, updateOrderValidation, validateRequest, authMiddleware, roleMiddleware("admin"), updateOrder); // Solo admin actualiza
router.delete("/:id", getOrderByIdValidation, validateRequest, authMiddleware, roleMiddleware("admin"), deleteOrder); // Solo admin elimina

// Rutas para reseñas
router.post("/product-order/:id_product_order/review", authMiddleware, roleMiddleware("client"), addReview); // Cliente agrega reseña
router.get("/products/:id_product/reviews", getProductReviews); // Público - obtener reseñas de un producto

// Rutas para pagos por transferencia
router.patch("/:id/payment-receipt", authMiddleware, roleMiddleware("client"), updatePaymentReceipt); // Cliente sube comprobante
router.patch("/:id/verify-payment", authMiddleware, roleMiddleware("seller"), verifyPayment); // Vendedor verifica pago

export default router;
