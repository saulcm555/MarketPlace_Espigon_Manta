import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { getProducts, createProduct, deleteProduct } from "../controllers/productController";

const router = Router();

router.get("/", getProducts); // pública
router.post("/", authMiddleware, createProduct); // protegida
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteProduct); // solo admin

export default router;
