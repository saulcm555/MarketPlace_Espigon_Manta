import { Request, Response } from "express";
import { ManageCart } from "../../../application/use_cases/cart/ManageCart";
import { AddProductToCart } from "../../../application/use_cases/cart/AddProductToCart";
import { RemoveProductFromCart } from "../../../application/use_cases/cart/RemoveProductFromCart";
import { UpdateCartItemQuantity } from "../../../application/use_cases/cart/UpdateCartItemQuantity";
import { GetCartWithProducts } from "../../../application/use_cases/cart/GetCartWithProducts";
import { CartService } from "../../../domain/services/CartService";
import { CartRepositoryImpl } from "../../repositories/CartRepositoryImpl";
import { ClientService } from "../../../domain/services/ClientService";
import { ClientRepositoryImpl } from "../../repositories/ClientRepositoryImpl";
import { asyncHandler, NotFoundError } from "../../middlewares/errors";

// Instancias de dependencias
const cartRepository = new CartRepositoryImpl();
const cartService = new CartService(cartRepository);
const clientRepository = new ClientRepositoryImpl();
const clientService = new ClientService(clientRepository);

export const getCarts = asyncHandler(async (req: Request, res: Response) => {
  // Si es admin, obtener todos los carritos
  // Si es cliente, obtener solo sus carritos
  const userId = (req as any).user?.id;
  const userEmail = (req as any).user?.email;
  const userRole = (req as any).user?.role;
  
  if (userRole === 'admin') {
    const carts = await cartService.getAllCarts();
    res.json(carts);
  } else {
    // Obtener el id_client numérico del cliente
    const client = await clientService.findOrLinkClientByUserIdAndEmail(userId, userEmail);
    
    if (!client) {
      res.json([]);
      return;
    }
    
    // Cliente obtiene solo sus carritos filtrando por id_client numérico
    const carts = await cartService.getAllCarts();
    const userCarts = carts.filter(cart => cart.id_client === client.id_client);
    res.json(userCarts);
  }
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
  
  const cart = await cartService.createCart(cartData);
  res.status(201).json(cart);
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
  const getCartUseCase = new GetCartWithProducts();
  const id_cart = Number(req.params.id);
  const id_product = Number(req.params.productId);
  
  // Eliminar el producto del carrito
  const success = await removeProductUseCase.execute({ id_cart, id_product });
  
  if (!success) {
    throw new NotFoundError("Producto en el carrito");
  }
  
  // Devolver el carrito actualizado
  const updatedCart = await getCartUseCase.execute(id_cart);
  res.json(updatedCart);
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
