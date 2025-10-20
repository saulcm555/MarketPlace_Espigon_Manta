import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { getCarts, getCartById, createCart, updateCart, deleteCart } from "../controllers/cartController";

const router = Router();

router.get("/", authMiddleware, getCarts); // Cliente ve su carrito
router.get("/:id", authMiddleware, getCartById); // Cliente ve su carrito
router.post("/", authMiddleware, roleMiddleware("client"), createCart); // Solo cliente
router.put("/:id", authMiddleware, roleMiddleware("client"), updateCart); // Solo cliente
router.delete("/:id", authMiddleware, roleMiddleware("client"), deleteCart); // Solo cliente

export default router;
