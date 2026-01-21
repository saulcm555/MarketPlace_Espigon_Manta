import { Request, Response } from "express";
import { CreateProduct } from "../../../application/use_cases/products/CreateProduct";
import { ListProducts } from "../../../application/use_cases/products/ListProducts";
import { ManageProducts as ManageProductsUseCase } from "../../../application/use_cases/products/ManageProducts";
import { ProductService } from "../../../domain/services/ProductService";
import { InventoryService } from "../../../domain/services/InventoryService";
import { ProductRepositoryImpl } from "../../repositories/ProductRepositoryImpl";
import { InventoryRepositoryImpl } from "../../repositories/InventoryRepositoryImpl";
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from "../../middlewares/errors";
import { notifySellerStatsUpdated, notifyAdminStatsUpdated } from "../../clients/statsEventClient";
import { notifyProductUpdated, notifyAdmins } from "../../clients/notificationClient";
import AppDataSource from "../../database/data-source";
import { SellerEntity } from "../../../models/sellerModel";

// Instancias de dependencias
const productRepository = new ProductRepositoryImpl();
const productService = new ProductService(productRepository);

const inventoryRepository = new InventoryRepositoryImpl();
const inventoryService = new InventoryService(inventoryRepository);

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const listProductsUseCase = new ListProducts(productService);
  
  // Construir filtros desde query params
  const filters: any = {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10,
  };
  
  if (req.query.id_category) filters.id_category = Number(req.query.id_category);
  if (req.query.id_sub_category) filters.id_sub_category = Number(req.query.id_sub_category);
  
  // Manejar id_seller - puede ser UUID (user_id) o número
  if (req.query.id_seller) {
    const sellerParam = req.query.id_seller as string;
    const numericSellerId = Number(sellerParam);
    
    // Si es un UUID (NaN cuando se convierte a número), buscar por user_id
    if (isNaN(numericSellerId)) {
      console.log('[getProducts] Seller param es UUID, buscando en tabla seller:', sellerParam);
      const sellerRepo = AppDataSource.getRepository(SellerEntity);
      const seller = await sellerRepo.findOne({ where: { user_id: sellerParam } });
      
      if (seller) {
        filters.id_seller = seller.id_seller;
        console.log('[getProducts] Encontrado id_seller numérico:', seller.id_seller);
      } else {
        // Si no se encuentra el vendedor, retornar lista vacía
        console.log('[getProducts] No se encontró vendedor con user_id:', sellerParam);
        return res.json({ products: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } });
      }
    } else {
      filters.id_seller = numericSellerId;
    }
  }
  
  if (req.query.min_price) filters.min_price = Number(req.query.min_price);
  if (req.query.max_price) filters.max_price = Number(req.query.max_price);
  if (req.query.search) filters.search = req.query.search as string;
  if (req.query.sort_by) filters.sort_by = req.query.sort_by;
  if (req.query.sort_order) filters.sort_order = req.query.sort_order;
  
  const result = await listProductsUseCase.execute(filters);
  res.json(result);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  // Obtener id_seller desde el usuario autenticado
  const user = (req as any).user;
  
  if (!user) {
    throw new BadRequestError("Usuario no autenticado");
  }
  
  // Resolver id_seller: puede venir directo en el token o hay que buscarlo por UUID
  let sellerId = user.id_seller;
  
  if (!sellerId && user.id) {
    const sellerRepo = AppDataSource.getRepository(SellerEntity);
    let seller = await sellerRepo.findOne({ where: { user_id: user.id } });
    
    // Fallback: buscar por email
    if (!seller && user.email) {
      seller = await sellerRepo.findOne({ where: { seller_email: user.email } });
      if (seller) {
        // Vincular para futuras búsquedas
        await sellerRepo.update(seller.id_seller, { user_id: user.id });
      }
    }
    
    if (seller) {
      sellerId = seller.id_seller;
    }
  }
  
  if (!sellerId) {
    throw new BadRequestError("No se pudo identificar el vendedor");
  }
  
  // Combinar datos del body con el id_seller resuelto
  const productData = {
    ...req.body,
    id_seller: sellerId
  };
  
  const createProductUseCase = new CreateProduct(productService, inventoryService);
  const product = await createProductUseCase.execute(productData);
  
  // Notificar actualización de estadísticas
  await notifySellerStatsUpdated(sellerId.toString());
  await notifyAdminStatsUpdated();
  
  // Notificar creación de producto
  await notifyProductUpdated(product.id_product, sellerId.toString(), product);
  await notifyAdmins('PRODUCT_CREATED', { product });
  
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
    
    // Resolver id_seller del usuario autenticado
    let authenticatedSellerId = user.id_seller;
    
    if (!authenticatedSellerId && user.id && user.role === 'seller') {
      const sellerRepo = AppDataSource.getRepository(SellerEntity);
      let seller = await sellerRepo.findOne({ where: { user_id: user.id } });
      
      // Fallback: buscar por email
      if (!seller && user.email) {
        seller = await sellerRepo.findOne({ where: { seller_email: user.email } });
        if (seller) {
          // Vincular para futuras búsquedas
          await sellerRepo.update(seller.id_seller, { user_id: user.id });
        }
      }
      
      if (seller) {
        authenticatedSellerId = seller.id_seller;
      }
    }
    
    console.log('👤 Usuario:', user.role, 'ID resuelto:', authenticatedSellerId);
    console.log('🏪 Producto pertenece a:', existingProduct.id_seller);
    
    if (user.role === 'seller' && existingProduct.id_seller !== authenticatedSellerId) {
      console.log('🚫 Permiso denegado');
      throw new ForbiddenError("No tienes permiso para actualizar este producto");
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
    if (req.body.status !== undefined) updateData.status = req.body.status; // ✅ AGREGADO: Mapear status
    
    console.log('📝 Datos mapeados para actualización:', JSON.stringify(updateData, null, 2));
    
    // Actualizar producto
    const updatedProduct = await productService.updateProduct(id.toString(), updateData);
    console.log('✅ Producto actualizado exitosamente');
    
    // Notificar actualización de estadísticas
    if (updatedProduct.id_seller) {
      await notifySellerStatsUpdated(updatedProduct.id_seller.toString());
      await notifyAdminStatsUpdated();
      
      // Notificar actualización de producto
      await notifyProductUpdated(updatedProduct.id_product, updatedProduct.id_seller.toString(), updatedProduct);
      await notifyAdmins('PRODUCT_UPDATED', { product: updatedProduct });
    }
    
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
  
  // Resolver id_seller del usuario autenticado
  let authenticatedSellerId = user.id_seller;
  
  if (!authenticatedSellerId && user.id && user.role === 'seller') {
    const sellerRepo = AppDataSource.getRepository(SellerEntity);
    let seller = await sellerRepo.findOne({ where: { user_id: user.id } });
    
    if (!seller && user.email) {
      seller = await sellerRepo.findOne({ where: { seller_email: user.email } });
      if (seller) {
        await sellerRepo.update(seller.id_seller, { user_id: user.id });
      }
    }
    
    if (seller) {
      authenticatedSellerId = seller.id_seller;
    }
  }
  
  if (user.role === 'seller' && product.id_seller !== authenticatedSellerId) {
    throw new ForbiddenError("No tienes permiso para eliminar este producto");
  }
  
  const success = await productService.deleteProduct(id.toString());
  if (!success) {
    throw new NotFoundError("Producto");
  }
  
  // Notificar actualización de estadísticas
  await notifySellerStatsUpdated(product.id_seller.toString());
  await notifyAdminStatsUpdated();
  
  // Notificar eliminación de producto
  await notifyAdmins('PRODUCT_DELETED', { product_id: id, seller_id: product.id_seller });
  
  res.json({ message: "Producto eliminado correctamente" });
});