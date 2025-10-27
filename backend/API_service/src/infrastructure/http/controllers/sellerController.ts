import { Request, Response } from "express";
import { SellerEntity } from "../../../models/sellerModel";
import AppDataSource from "../../database/data-source";

export const getSellers = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SellerEntity);
    const sellers = await repo.find();
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener sellers", error });
  }
};

export const getSellerById = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SellerEntity);
    const id = Number(req.params.id);
    const seller = await repo.findOneBy({ id_seller: id });
    if (!seller) {
      return res.status(404).json({ message: "Seller no encontrado" });
    }
    res.json(seller);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener seller", error });
  }
};

export const createSeller = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SellerEntity);
    const seller = repo.create(req.body);
    await repo.save(seller);
    res.status(201).json(seller);
  } catch (error) {
    res.status(500).json({ message: "Error al crear seller", error });
  }
};

export const updateSeller = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SellerEntity);
    const id = Number(req.params.id);
    const seller = await repo.findOneBy({ id_seller: id });
    if (!seller) {
      return res.status(404).json({ message: "Seller no encontrado" });
    }
    repo.merge(seller, req.body);
    await repo.save(seller);
    res.json(seller);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar seller", error });
  }
};

export const deleteSeller = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SellerEntity);
    const id = Number(req.params.id);
    const result = await repo.delete(id);
    if (result.affected && result.affected > 0) {
      res.json({ message: "Seller eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Seller no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar seller", error });
  }
};
