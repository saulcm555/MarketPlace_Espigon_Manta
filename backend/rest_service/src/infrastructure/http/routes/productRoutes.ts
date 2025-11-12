import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { ownershipMiddleware } from "../../middlewares/ownershipMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createProductValidation,
  getProductsValidation,
  deleteProductValidation,
  updateProductValidation,
  getProductByIdValidation
} from "../../middlewares/validations/productValidations";
import { 
  getProducts, 
  getProductById,
  createProduct, 
  updateProduct,
  deleteProduct 
} from "../controllers/productController";

const router = Router();

router.get("/", getProductsValidation, validateRequest, getProducts); // pública
router.get("/:id", getProductByIdValidation, validateRequest, getProductById); // pública
router.post("/", createProductValidation, validateRequest, authMiddleware, roleMiddleware("seller"), createProduct); // solo vendedores
router.put("/:id", updateProductValidation, validateRequest, authMiddleware, roleMiddleware("seller"), ownershipMiddleware("product"), updateProduct); // solo el seller dueño o admin
router.delete("/:id", deleteProductValidation, validateRequest, authMiddleware, roleMiddleware("seller"), ownershipMiddleware("product"), deleteProduct); // solo el seller dueño o admin

export default router;
