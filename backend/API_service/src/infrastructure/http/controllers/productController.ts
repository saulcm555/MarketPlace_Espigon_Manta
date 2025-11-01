import { Request, Response } from "express";
import { ProductEntity } from "../../../models/productModel";
import AppDataSource from "../../../infrastructure/database/data-source";

export const getProducts = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(ProductEntity);
  const products = await repo.find();
  res.json(products);
};

export const createProduct = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(ProductEntity);
  const product = repo.create(req.body);
  await repo.save(product);
  res.status(201).json(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(ProductEntity);
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "ID inválido" });
  }
  const result = await repo.delete(id);
  if (result.affected && result.affected > 0) {
    res.json({ message: "Producto eliminado" });
  } else {
    res.status(404).json({ message: "Producto no encontrado" });
  }
};