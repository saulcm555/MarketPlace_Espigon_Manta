import { Request, Response } from "express";
import { ManageCart } from "../../../application/use_cases/cart/ManageCart";
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
    cartService.createCart(req.body, (err, cart) => {
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
