import { Request, Response } from "express";
import { CreateProduct } from "../../../application/use_cases/products/CreateProduct";
import { ListProducts } from "../../../application/use_cases/products/ListProducts";
import { ManageProducts as ManageProductsUseCase } from "../../../application/use_cases/products/ManageProducts";
import { ProductService } from "../../../domain/services/ProductService";
import { ProductRepositoryImpl } from "../../repositories/ProductRepositoryImpl";
import { asyncHandler, NotFoundError, BadRequestError, UnauthorizedError } from "../../middlewares/errors";

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

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) {
    throw new BadRequestError("ID inválido");
  }
  
  const product = await productService.getProductById(id.toString());
  if (!product) {
    throw new NotFoundError("Producto");
  }
  
  res.json(product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      throw new BadRequestError("ID inválido");
    }
    
    console.log('🔄 Actualizando producto:', id);
    console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    // Verificar que el producto existe
    const existingProduct = await productService.getProductById(id.toString());
    if (!existingProduct) {
      console.log('❌ Producto no encontrado:', id);
      throw new NotFoundError("Producto");
    }
    
    console.log('✅ Producto encontrado:', existingProduct.id_product);
    
    // Verificar permisos: admin puede actualizar cualquiera, seller solo sus productos
    const user = (req as any).user;
    console.log('👤 Usuario:', user.role, 'ID:', user.id_seller || user.id);
    console.log('🏪 Producto pertenece a:', existingProduct.id_seller);
    
    if (user.role === 'seller' && existingProduct.id_seller !== user.id_seller && existingProduct.id_seller !== user.id) {
      console.log('🚫 Permiso denegado');
      throw new UnauthorizedError("No tienes permiso para actualizar este producto");
    }
    
    console.log('✅ Permisos verificados, actualizando...');
    
    // Mapear nombres de campos del frontend a la base de datos
    const updateData: any = {};
    
    if (req.body.product_name !== undefined) updateData.product_name = req.body.product_name;
    if (req.body.product_description !== undefined) updateData.description = req.body.product_description;
    if (req.body.product_price !== undefined) updateData.price = req.body.product_price;
    if (req.body.product_image !== undefined) updateData.image_url = req.body.product_image;
    if (req.body.stock !== undefined) updateData.stock = req.body.stock;
    if (req.body.id_category !== undefined) updateData.id_category = req.body.id_category;
    if (req.body.id_sub_category !== undefined) updateData.id_sub_category = req.body.id_sub_category;
    if (req.body.id_seller !== undefined) updateData.id_seller = req.body.id_seller;
    if (req.body.id_inventory !== undefined) updateData.id_inventory = req.body.id_inventory;
    
    console.log('📝 Datos mapeados para actualización:', JSON.stringify(updateData, null, 2));
    
    // Actualizar producto
    const updatedProduct = await productService.updateProduct(id.toString(), updateData);
    console.log('✅ Producto actualizado exitosamente');
    res.json(updatedProduct);
  } catch (error) {
    console.error('❌ Error en updateProduct:', error);
    throw error;
  }
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) {
    throw new BadRequestError("ID inválido");
  }
  
  // Verificar que el producto existe
  const product = await productService.getProductById(id.toString());
  if (!product) {
    throw new NotFoundError("Producto");
  }
  
  // Verificar permisos: admin puede eliminar cualquiera, seller solo sus productos
  const user = (req as any).user;
  if (user.role === 'seller' && product.id_seller !== user.id_seller && product.id_seller !== user.id) {
    throw new UnauthorizedError("No tienes permiso para eliminar este producto");
  }
  
  const success = await productService.deleteProduct(id.toString());
  if (!success) {
    throw new NotFoundError("Producto");
  }
  
  res.json({ message: "Producto eliminado correctamente" });
});