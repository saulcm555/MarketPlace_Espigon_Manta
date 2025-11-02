import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createProductValidation,
  getProductsValidation,
  deleteProductValidation
} from "../../middlewares/validations/productValidations";
import { getProducts, createProduct, deleteProduct } from "../controllers/productController";

const router = Router();

router.get("/", getProductsValidation, validateRequest, getProducts); // pública
router.post("/", createProductValidation, validateRequest, authMiddleware, createProduct); // protegida
router.delete("/:id", deleteProductValidation, validateRequest, authMiddleware, roleMiddleware("admin"), deleteProduct); // solo admin

export default router;
