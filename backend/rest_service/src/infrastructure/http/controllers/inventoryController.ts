import { Request, Response } from "express";
import { UpdateStock } from "../../../application/use_cases/inventory/UpdateStock";
import { QueryInventory } from "../../../application/use_cases/inventory/QueryInventory";
import { InventoryService } from "../../../domain/services/InventoryService";
import { ProductService } from "../../../domain/services/ProductService";
import { InventoryRepositoryImpl } from "../../repositories/InventoryRepositoryImpl";
import { ProductRepositoryImpl } from "../../repositories/ProductRepositoryImpl";
import { asyncHandler, NotFoundError } from "../../middlewares/errors";

// Instancias de dependencias
const inventoryRepository = new InventoryRepositoryImpl();
const productRepository = new ProductRepositoryImpl();
const inventoryService = new InventoryService(inventoryRepository);
const productService = new ProductService(productRepository);

export const getInventories = asyncHandler(async (req: Request, res: Response) => {
  const inventories = await inventoryService.getAllInventories();
  res.json(inventories);
});

export const getInventoryById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const inventory = await inventoryService.getInventoryById(id.toString());
  
  if (!inventory) {
    throw new NotFoundError("Inventario");
  }
  res.json(inventory);
});

export const createInventory = asyncHandler(async (req: Request, res: Response) => {
  const inventory = await new Promise((resolve, reject) => {
    inventoryService.createInventory(req.body, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
  res.status(201).json(inventory);
});

export const updateInventory = asyncHandler(async (req: Request, res: Response) => {
  const updateStockUseCase = new UpdateStock(productService, inventoryService);
  const id = Number(req.params.id);
  
  const product = await updateStockUseCase.execute({
    id_product: id,
    stock: req.body.stock,
    operation: req.body.operation || "set",
    id_seller: req.body.id_seller,
  });
  
  res.json(product);
});

export const deleteInventory = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const success = await inventoryService.deleteInventory(id.toString());
  
  if (!success) {
    throw new NotFoundError("Inventario");
  }
  
  res.json({ message: "Inventario eliminado correctamente" });
});
