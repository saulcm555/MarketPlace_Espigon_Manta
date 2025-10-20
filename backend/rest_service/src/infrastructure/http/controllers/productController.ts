import { Request, Response } from "express";
import { CreateProduct } from "../../../application/use_cases/products/CreateProduct";
import { ListProducts } from "../../../application/use_cases/products/ListProducts";
import { ManageProducts as ManageProductsUseCase } from "../../../application/use_cases/products/ManageProducts";
import { ProductService } from "../../../domain/services/ProductService";
import { ProductRepositoryImpl } from "../../repositories/ProductRepositoryImpl";

// Instancias de dependencias
const productRepository = new ProductRepositoryImpl();
const productService = new ProductService(productRepository);

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