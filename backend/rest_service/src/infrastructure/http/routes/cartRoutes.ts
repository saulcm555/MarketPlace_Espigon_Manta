import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createCartValidation,
  getCartByIdValidation,
  addProductToCartValidation,
  updateCartItemValidation
} from "../../middlewares/validations/cartValidations";
import { 
  getCarts, 
  getCartById, 
  createCart, 
  updateCart, 
  deleteCart,
  addProductToCart,
  removeProductFromCart,
  updateCartItemQuantity,
  getCartWithProducts
} from "../controllers/cartController";

const router = Router();

// Rutas básicas de carrito
router.get("/", authMiddleware, getCarts); // Cliente ve su carrito
router.get("/:id", getCartByIdValidation, validateRequest, authMiddleware, getCartById); // Cliente ve su carrito
router.post("/", createCartValidation, validateRequest, authMiddleware, roleMiddleware("client"), createCart); // Solo cliente
router.put("/:id", getCartByIdValidation, validateRequest, authMiddleware, roleMiddleware("client"), updateCart); // Solo cliente
router.delete("/:id", getCartByIdValidation, validateRequest, authMiddleware, roleMiddleware("client"), deleteCart); // Solo cliente

// ============================================
// RUTAS PARA MANEJAR PRODUCTCART (TABLA TRANSACCIONAL)
// ============================================

// Obtener carrito con todos sus productos (relación ProductCart)
router.get("/:id/with-products", getCartByIdValidation, validateRequest, authMiddleware, getCartWithProducts);

// Agregar un producto a un carrito específico
router.post("/:id/products", getCartByIdValidation, addProductToCartValidation, validateRequest, authMiddleware, roleMiddleware("client"), addProductToCart);

// Actualizar cantidad de un producto en el carrito
router.put("/:id/products/:productId", getCartByIdValidation, updateCartItemValidation, validateRequest, authMiddleware, roleMiddleware("client"), updateCartItemQuantity);

// Quitar un producto del carrito
router.delete("/:id/products/:productId", getCartByIdValidation, updateCartItemValidation, validateRequest, authMiddleware, roleMiddleware("client"), removeProductFromCart);

export default router;
