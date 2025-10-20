import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { getOrders, getOrderById, createOrder, updateOrder, deleteOrder } from "../controllers/orderController";

const router = Router();

router.get("/", authMiddleware, roleMiddleware("admin"), getOrders); // Solo admin ve todas
router.get("/:id", authMiddleware, getOrderById); // Cliente ve su orden
router.post("/", authMiddleware, roleMiddleware("client"), createOrder); // Solo cliente crea orden
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateOrder); // Solo admin actualiza
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteOrder); // Solo admin elimina

export default router;
