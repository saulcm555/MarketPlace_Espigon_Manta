import { Request, Response } from "express";
import { CreateProduct } from "../../../application/use_cases/products/CreateProduct";
import { ListProducts } from "../../../application/use_cases/products/ListProducts";
import { ManageProducts as ManageProductsUseCase } from "../../../application/use_cases/products/ManageProducts";
import { ProductService } from "../../../domain/services/ProductService";
import { ProductRepositoryImpl } from "../../repositories/ProductRepositoryImpl";

// Instancias de dependencias
const productRepository = new ProductRepositoryImpl();
const productService = new ProductService(productRepository);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar productos con filtros
 *     description: Obtiene lista de productos con paginación y filtros opcionales
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de productos por página
 *       - in: query
 *         name: id_category
 *         schema:
 *           type: integer
 *         description: Filtrar por categoría
 *       - in: query
 *         name: id_sub_category
 *         schema:
 *           type: integer
 *         description: Filtrar por subcategoría
 *       - in: query
 *         name: id_seller
 *         schema:
 *           type: integer
 *         description: Filtrar por vendedor
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Precio máximo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o descripción
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *         description: Campo para ordenar
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Orden ascendente o descendente
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const listProductsUseCase = new ListProducts(productService);
    
    // Construir filtros desde query params
    const filters: any = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    };
    
    if (req.query.id_category) filters.id_category = Number(req.query.id_category);
    if (req.query.id_sub_category) filters.id_sub_category = Number(req.query.id_sub_category);
    if (req.query.id_seller) filters.id_seller = Number(req.query.id_seller);
    if (req.query.min_price) filters.min_price = Number(req.query.min_price);
    if (req.query.max_price) filters.max_price = Number(req.query.max_price);
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.sort_by) filters.sort_by = req.query.sort_by;
    if (req.query.sort_order) filters.sort_order = req.query.sort_order;
    
    const result = await listProductsUseCase.execute(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      message: "Error al obtener productos", 
      error: error.message 
    });
  }
};

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear nuevo producto
 *     description: Crea un nuevo producto en el sistema
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_name
 *               - product_price
 *               - id_category
 *               - id_seller
 *             properties:
 *               product_name:
 *                 type: string
 *                 example: Laptop Dell
 *               product_description:
 *                 type: string
 *                 example: Laptop Dell XPS 15 con 16GB RAM
 *               product_price:
 *                 type: number
 *                 example: 1299.99
 *               product_image:
 *                 type: string
 *                 example: http://example.com/image.jpg
 *               id_category:
 *                 type: integer
 *                 example: 1
 *               id_sub_category:
 *                 type: integer
 *                 example: 1
 *               id_seller:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const createProductUseCase = new CreateProduct(productService);
    const product = await createProductUseCase.execute(req.body);
    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ 
      message: error.message || "Error al crear producto" 
    });
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     description: Elimina un producto del sistema por su ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "ID inválido" });
    }
    
    const success = await productService.deleteProduct(id.toString());
    if (success) {
      res.json({ message: "Producto eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Producto no encontrado" });
    }
  } catch (error: any) {
    res.status(500).json({ 
      message: "Error al eliminar producto", 
      error: error.message 
    });
  }
};