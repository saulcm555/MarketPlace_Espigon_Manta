import { Request, Response } from "express";
import { InventoryEntity } from "../../../models/inventoryModel";
import AppDataSource from "../../database/data-source";

export const getInventories = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(InventoryEntity);
    const inventories = await repo.find();
    res.json(inventories);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener inventarios", error });
  }
};

export const getInventoryById = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(InventoryEntity);
    const id = Number(req.params.id);
    const inventory = await repo.findOneBy({ id_inventory: id });
    if (!inventory) {
      return res.status(404).json({ message: "Inventario no encontrado" });
    }
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener inventario", error });
  }
};

export const createInventory = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(InventoryEntity);
    const inventory = repo.create(req.body);
    await repo.save(inventory);
    res.status(201).json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Error al crear inventario", error });
  }
};

export const updateInventory = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(InventoryEntity);
    const id = Number(req.params.id);
    const inventory = await repo.findOneBy({ id_inventory: id });
    if (!inventory) {
      return res.status(404).json({ message: "Inventario no encontrado" });
    }
    repo.merge(inventory, req.body);
    await repo.save(inventory);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar inventario", error });
  }
};

export const deleteInventory = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(InventoryEntity);
    const id = Number(req.params.id);
    const result = await repo.delete(id);
    if (result.affected && result.affected > 0) {
      res.json({ message: "Inventario eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Inventario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar inventario", error });
  }
};
