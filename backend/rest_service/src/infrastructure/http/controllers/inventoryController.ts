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

/**
 * @swagger
 * /api/inventories:
 *   get:
 *     summary: Listar todos los inventarios
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de inventarios obtenida exitosamente
 */
export const getInventories = async (req: Request, res: Response) => {
  try {
    const inventories = await inventoryService.getAllInventories();
    res.json(inventories);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener inventarios", error: error.message });
  }
};

/**
 * @swagger
 * /api/inventories/{id}:
 *   get:
 *     summary: Obtener inventario por ID
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventario obtenido exitosamente
 */
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

/**
 * @swagger
 * /api/inventories:
 *   post:
 *     summary: Crear nuevo inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_seller
 *             properties:
 *               id_seller:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Inventario creado exitosamente
 */
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

/**
 * @swagger
 * /api/inventories/{id}:
 *   put:
 *     summary: Actualizar stock del inventario
 *     description: Actualiza el stock de un producto en el inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock
 *               - id_seller
 *             properties:
 *               stock:
 *                 type: integer
 *                 example: 50
 *               operation:
 *                 type: string
 *                 enum: [set, add, subtract]
 *                 default: set
 *                 example: set
 *               id_seller:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Stock actualizado exitosamente
 */
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

/**
 * @swagger
 * /api/inventories/{id}:
 *   delete:
 *     summary: Eliminar inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventario eliminado correctamente
 */
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
