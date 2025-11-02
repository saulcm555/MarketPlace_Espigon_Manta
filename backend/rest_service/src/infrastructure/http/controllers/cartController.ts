import { Request, Response } from "express";
import { ManageCart } from "../../../application/use_cases/cart/ManageCart";
import { AddProductToCart } from "../../../application/use_cases/cart/AddProductToCart";
import { RemoveProductFromCart } from "../../../application/use_cases/cart/RemoveProductFromCart";
import { UpdateCartItemQuantity } from "../../../application/use_cases/cart/UpdateCartItemQuantity";
import { GetCartWithProducts } from "../../../application/use_cases/cart/GetCartWithProducts";
import { CartService } from "../../../domain/services/CartService";
import { CartRepositoryImpl } from "../../repositories/CartRepositoryImpl";
import { asyncHandler, NotFoundError } from "../../middlewares/errors";

// Instancias de dependencias
const cartRepository = new CartRepositoryImpl();
const cartService = new CartService(cartRepository);

export const getCarts = asyncHandler(async (req: Request, res: Response) => {
  // Para admin - obtener todos los carritos
  const carts = await cartService.getAllCarts();
  res.json(carts);
});

export const getCartById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const cart = await cartService.getCartById(id.toString());
  
  if (!cart) {
    throw new NotFoundError("Carrito");
  }
  res.json(cart);
});

export const createCart = asyncHandler(async (req: Request, res: Response) => {
  // Agregar status por defecto si no se proporciona
  const cartData = {
    ...req.body,
    status: req.body.status || "active",
    quantity: req.body.quantity || 0,
    id_product: req.body.id_product || 0
  };
  
  return new Promise<void>((resolve, reject) => {
    cartService.createCart(cartData, (err, cart) => {
      if (err) {
        reject(err);
      } else {
        res.status(201).json(cart);
        resolve();
      }
    });
  });
});

export const updateCart = asyncHandler(async (req: Request, res: Response) => {
  const manageCartUseCase = new ManageCart(cartService);
  const id = Number(req.params.id);
  
  const cart = await manageCartUseCase.updateCartItem({
    id_cart: id,
    quantity: req.body.quantity,
  });
  
  res.json(cart);
});

export const deleteCart = asyncHandler(async (req: Request, res: Response) => {
  const manageCartUseCase = new ManageCart(cartService);
  const id = Number(req.params.id);
  
  const success = await manageCartUseCase.removeFromCart({ id_cart: id });
  
  if (!success) {
    throw new NotFoundError("Carrito");
  }
  
  res.json({ message: "Carrito eliminado correctamente" });
});

// ============================================
// NUEVOS MÉTODOS PARA MANEJAR PRODUCTCART (TABLA TRANSACCIONAL)
// ============================================

export const addProductToCart = asyncHandler(async (req: Request, res: Response) => {
  const addProductUseCase = new AddProductToCart();
  const id_cart = Number(req.params.id);
  
  const productCart = await addProductUseCase.execute({
    id_cart,
    id_product: req.body.id_product,
    quantity: req.body.quantity,
  });
  
  res.status(201).json(productCart);
});

export const removeProductFromCart = asyncHandler(async (req: Request, res: Response) => {
  const removeProductUseCase = new RemoveProductFromCart();
  const id_cart = Number(req.params.id);
  const id_product = Number(req.params.productId);
  
  // Buscar el ProductCart por id_cart y id_product
  const success = await removeProductUseCase.execute({ id_cart, id_product });
  
  if (!success) {
    throw new NotFoundError("Producto en el carrito");
  }
  
  res.json({ message: "Producto eliminado del carrito correctamente" });
});

export const updateCartItemQuantity = asyncHandler(async (req: Request, res: Response) => {
  const updateQuantityUseCase = new UpdateCartItemQuantity();
  const id_cart = Number(req.params.id);
  const id_product = Number(req.params.productId);
  
  const productCart = await updateQuantityUseCase.execute({
    id_cart,
    id_product,
    quantity: req.body.quantity,
  });
  
  res.json(productCart);
});

export const getCartWithProducts = asyncHandler(async (req: Request, res: Response) => {
  const getCartUseCase = new GetCartWithProducts();
  const id_cart = Number(req.params.id);
  
  const cart = await getCartUseCase.execute(id_cart);
  
  if (!cart) {
    throw new NotFoundError("Carrito");
  }
  
  res.json(cart);
});
