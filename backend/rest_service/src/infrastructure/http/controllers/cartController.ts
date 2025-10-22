import { Request, Response } from "express";
import { ManageCart } from "../../../application/use_cases/cart/ManageCart";
import { AddProductToCart } from "../../../application/use_cases/cart/AddProductToCart";
import { RemoveProductFromCart } from "../../../application/use_cases/cart/RemoveProductFromCart";
import { UpdateCartItemQuantity } from "../../../application/use_cases/cart/UpdateCartItemQuantity";
import { GetCartWithProducts } from "../../../application/use_cases/cart/GetCartWithProducts";
import { CartService } from "../../../domain/services/CartService";
import { CartRepositoryImpl } from "../../repositories/CartRepositoryImpl";

// Instancias de dependencias
const cartRepository = new CartRepositoryImpl();
const cartService = new CartService(cartRepository);

export const getCarts = async (req: Request, res: Response) => {
  try {
    // Para admin - obtener todos los carritos
    const carts = await cartService.getAllCarts();
    res.json(carts);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener carritos", error: error.message });
  }
};

export const getCartById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const cart = await cartService.getCartById(id.toString());
    
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }
    res.json(cart);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener carrito", error: error.message });
  }
};

export const createCart = async (req: Request, res: Response) => {
  try {
    // Agregar status por defecto si no se proporciona
    const cartData = {
      ...req.body,
      status: req.body.status || "active",
      quantity: req.body.quantity || 0,
      id_product: req.body.id_product || 0
    };
    
    cartService.createCart(cartData, (err, cart) => {
      if (err) {
        return res.status(500).json({ message: "Error al crear carrito", error: err.message });
      }
      res.status(201).json(cart);
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error al crear carrito", error: error.message });
  }
};

export const updateCart = async (req: Request, res: Response) => {
  try {
    const manageCartUseCase = new ManageCart(cartService);
    const id = Number(req.params.id);
    
    const cart = await manageCartUseCase.updateCartItem({
      id_cart: id,
      quantity: req.body.quantity,
    });
    
    res.json(cart);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar carrito" });
  }
};

export const deleteCart = async (req: Request, res: Response) => {
  try {
    const manageCartUseCase = new ManageCart(cartService);
    const id = Number(req.params.id);
    
    const success = await manageCartUseCase.removeFromCart({ id_cart: id });
    
    if (success) {
      res.json({ message: "Carrito eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Carrito no encontrado" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar carrito", error: error.message });
  }
};

// ============================================
// NUEVOS MÉTODOS PARA MANEJAR PRODUCTCART (TABLA TRANSACCIONAL)
// ============================================

/**
 * Agregar un producto a un carrito específico
 * POST /carts/:id/products
 */
export const addProductToCart = async (req: Request, res: Response) => {
  try {
    const addProductUseCase = new AddProductToCart();
    const id_cart = Number(req.params.id);
    
    const productCart = await addProductUseCase.execute({
      id_cart,
      id_product: req.body.id_product,
      quantity: req.body.quantity,
    });
    
    res.status(201).json(productCart);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al agregar producto al carrito" });
  }
};

/**
 * Quitar un producto del carrito
 * DELETE /carts/:id/products/:productId
 */
export const removeProductFromCart = async (req: Request, res: Response) => {
  try {
    const removeProductUseCase = new RemoveProductFromCart();
    const id_cart = Number(req.params.id);
    const id_product = Number(req.params.productId);
    
    // Buscar el ProductCart por id_cart y id_product
    const success = await removeProductUseCase.execute({ id_cart, id_product });
    
    if (success) {
      res.json({ message: "Producto eliminado del carrito correctamente" });
    } else {
      res.status(404).json({ message: "Producto no encontrado en el carrito" });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al eliminar producto del carrito" });
  }
};

/**
 * Actualizar cantidad de un producto en el carrito
 * PUT /carts/:id/products/:productId
 */
export const updateCartItemQuantity = async (req: Request, res: Response) => {
  try {
    const updateQuantityUseCase = new UpdateCartItemQuantity();
    const id_cart = Number(req.params.id);
    const id_product = Number(req.params.productId);
    
    const productCart = await updateQuantityUseCase.execute({
      id_cart,
      id_product,
      quantity: req.body.quantity,
    });
    
    res.json(productCart);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar cantidad" });
  }
};

/**
 * Obtener carrito con todos sus productos
 * GET /carts/:id/products
 */
export const getCartWithProducts = async (req: Request, res: Response) => {
  try {
    const getCartUseCase = new GetCartWithProducts();
    const id_cart = Number(req.params.id);
    
    const cart = await getCartUseCase.execute(id_cart);
    
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }
    
    res.json(cart);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al obtener carrito" });
  }
};
