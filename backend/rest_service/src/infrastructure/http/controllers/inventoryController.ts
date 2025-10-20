import { Request, Response } from "express";
import { UpdateStock } from "../../../application/use_cases/inventory/UpdateStock";
import { QueryInventory } from "../../../application/use_cases/inventory/QueryInventory";
import { InventoryService } from "../../../domain/services/InventoryService";
import { ProductService } from "../../../domain/services/ProductService";
import { InventoryRepositoryImpl } from "../../repositories/InventoryRepositoryImpl";
import { ProductRepositoryImpl } from "../../repositories/ProductRepositoryImpl";

// Instancias de dependencias
const inventoryRepository = new InventoryRepositoryImpl();
const productRepository = new ProductRepositoryImpl();
const inventoryService = new InventoryService(inventoryRepository);
const productService = new ProductService(productRepository);

export const getInventories = async (req: Request, res: Response) => {
  try {
    const inventories = await inventoryService.getAllInventories();
    res.json(inventories);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener inventarios", error: error.message });
  }
};

export const getInventoryById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const inventory = await inventoryService.getInventoryById(id.toString());
    
    if (!inventory) {
      return res.status(404).json({ message: "Inventario no encontrado" });
    }
    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener inventario", error: error.message });
  }
};

export const createInventory = async (req: Request, res: Response) => {
  try {
    inventoryService.createInventory(req.body, (err, inventory) => {
      if (err) {
        return res.status(500).json({ message: "Error al crear inventario", error: err.message });
      }
      res.status(201).json(inventory);
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error al crear inventario", error: error.message });
  }
};

export const updateInventory = async (req: Request, res: Response) => {
  try {
    const updateStockUseCase = new UpdateStock(productService, inventoryService);
    const id = Number(req.params.id);
    
    const product = await updateStockUseCase.execute({
      id_product: id,
      stock: req.body.stock,
      operation: req.body.operation || "set",
      id_seller: req.body.id_seller,
    });
    
    res.json(product);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar inventario" });
  }
};

export const deleteInventory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const success = await inventoryService.deleteInventory(id.toString());
    
    if (success) {
      res.json({ message: "Inventario eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Inventario no encontrado" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar inventario", error: error.message });
  }
};
