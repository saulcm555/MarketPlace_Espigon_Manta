import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { ownershipMiddleware } from "../../middlewares/ownershipMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createCartValidation,
  getCartByIdValidation,
  addProductToCartValidation,
  updateCartItemValidation,
  removeProductFromCartValidation
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
router.get("/", authMiddleware, roleMiddleware("client"), getCarts); // Cliente ve sus carritos
router.get("/:id", getCartByIdValidation, validateRequest, authMiddleware, roleMiddleware("client"), ownershipMiddleware("cart"), getCartById); // Solo el cliente dueño o admin
router.post("/", createCartValidation, validateRequest, authMiddleware, roleMiddleware("client"), createCart); // Solo cliente
router.put("/:id", getCartByIdValidation, validateRequest, authMiddleware, roleMiddleware("client"), ownershipMiddleware("cart"), updateCart); // Solo el cliente dueño o admin
router.delete("/:id", getCartByIdValidation, validateRequest, authMiddleware, roleMiddleware("client"), ownershipMiddleware("cart"), deleteCart); // Solo el cliente dueño o admin


// RUTAS PARA MANEJAR PRODUCTCART 

// Obtener carrito con todos sus productos (relación ProductCart)
router.get("/:id/with-products", getCartByIdValidation, validateRequest, authMiddleware, roleMiddleware("client"), ownershipMiddleware("cart"), getCartWithProducts);

// Agregar un producto a un carrito específico
router.post("/:id/products", getCartByIdValidation, addProductToCartValidation, validateRequest, authMiddleware, roleMiddleware("client"), ownershipMiddleware("cart"), addProductToCart);

// Actualizar cantidad de un producto en el carrito
router.put("/:id/products/:productId", getCartByIdValidation, updateCartItemValidation, validateRequest, authMiddleware, roleMiddleware("client"), ownershipMiddleware("cart"), updateCartItemQuantity);

// Quitar un producto del carrito
router.delete("/:id/products/:productId", removeProductFromCartValidation, validateRequest, authMiddleware, roleMiddleware("client"), ownershipMiddleware("cart"), removeProductFromCart);

export default router;
