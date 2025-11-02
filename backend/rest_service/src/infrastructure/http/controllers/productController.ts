import { Request, Response } from "express";
import { CreateProduct } from "../../../application/use_cases/products/CreateProduct";
import { ListProducts } from "../../../application/use_cases/products/ListProducts";
import { ManageProducts as ManageProductsUseCase } from "../../../application/use_cases/products/ManageProducts";
import { ProductService } from "../../../domain/services/ProductService";
import { ProductRepositoryImpl } from "../../repositories/ProductRepositoryImpl";
import { asyncHandler, NotFoundError, BadRequestError } from "../../middlewares/errors";

// Instancias de dependencias
const productRepository = new ProductRepositoryImpl();
const productService = new ProductService(productRepository);

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
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
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const createProductUseCase = new CreateProduct(productService);
  const product = await createProductUseCase.execute(req.body);
  res.status(201).json(product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) {
    throw new BadRequestError("ID inválido");
  }
  
  const success = await productService.deleteProduct(id.toString());
  if (!success) {
    throw new NotFoundError("Producto");
  }
  
  res.json({ message: "Producto eliminado correctamente" });
});