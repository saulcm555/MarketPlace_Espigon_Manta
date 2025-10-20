import { Request, Response } from "express";
import { CartEntity, ProductCartEntity } from "../../../models/cartModel";
import AppDataSource from "../../database/data-source";

export const getCarts = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CartEntity);
    const carts = await repo.find({ 
      relations: ["client", "product", "productCarts", "productCarts.product"] 
    });
    res.json(carts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener carritos", error });
  }
};

export const getCartById = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CartEntity);
    const id = Number(req.params.id);
    const cart = await repo.findOne({
      where: { id_cart: id },
      relations: ["client", "product", "productCarts", "productCarts.product"]
    });
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener carrito", error });
  }
};

export const createCart = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CartEntity);
    const cart = repo.create(req.body);
    await repo.save(cart);
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error al crear carrito", error });
  }
};

export const updateCart = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CartEntity);
    const id = Number(req.params.id);
    const cart = await repo.findOneBy({ id_cart: id });
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }
    repo.merge(cart, req.body);
    await repo.save(cart);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar carrito", error });
  }
};

export const deleteCart = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CartEntity);
    const id = Number(req.params.id);
    const result = await repo.delete(id);
    if (result.affected && result.affected > 0) {
      res.json({ message: "Carrito eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Carrito no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar carrito", error });
  }
};
