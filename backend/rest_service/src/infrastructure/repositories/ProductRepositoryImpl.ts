import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { ProductEntity } from "../../models/productModel";
import AppDataSource from "../database/data-source";

export class ProductRepositoryImpl implements IProductRepository {
  // CREATE con Callback
  create(
    product: Partial<ProductEntity>,
    callback: (error: Error | null, result?: ProductEntity) => void
  ): void {
    const repo = AppDataSource.getRepository(ProductEntity);
    const newProduct = repo.create(product);
    repo
      .save(newProduct)
      .then((saved) => callback(null, saved))
      .catch((err) => callback(err));
  }

  // UPDATE con Promise
  async update(id: string, data: Partial<ProductEntity>): Promise<ProductEntity> {
    const repo = AppDataSource.getRepository(ProductEntity);
    const productId = parseInt(id, 10);
    await repo.update(productId, data);
    const updated = await repo.findOneBy({ id_product: productId });
    if (!updated) throw new Error(`Product with id ${id} not found`);
    return updated;
  }

  // READ con async/await
  async findById(id: string): Promise<ProductEntity | null> {
    const repo = AppDataSource.getRepository(ProductEntity);
    const productId = parseInt(id, 10);
    
    // Usar QueryBuilder para hacer JOIN con seller, inventory, category y subcategory
    // Y calcular el rating promedio desde product_order
    const result = await repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .leftJoinAndMapOne(
        'product.seller',
        'seller',
        'seller',
        'seller.id_seller = product.id_seller'
      )
      .leftJoinAndMapOne(
        'product.category',
        'category',
        'category',
        'category.id_category = product.id_category'
      )
      .leftJoinAndMapOne(
        'product.subCategory',
        'sub_category',
        'sub_category',
        'sub_category.id_sub_category = product.id_sub_category'
      )
      .leftJoin('product_order', 'po', 'po.id_product = product.id_product AND po.rating IS NOT NULL')
      .addSelect('COALESCE(AVG(po.rating), 0)', 'product_avg_rating')
      .addSelect('COUNT(po.rating)', 'product_review_count')
      .where('product.id_product = :id', { id: productId })
      .groupBy('product.id_product')
      .addGroupBy('inventory.id_inventory')
      .addGroupBy('seller.id_seller')
      .addGroupBy('category.id_category')
      .addGroupBy('sub_category.id_sub_category')
      .getRawAndEntities();
    
    if (!result.entities || result.entities.length === 0) {
      return null;
    }
    
    const product = result.entities[0];
    const rawData = result.raw[0];
    
    return {
      ...product,
      avgRating: parseFloat(rawData.product_avg_rating) || 0,
      reviewCount: parseInt(rawData.product_review_count) || 0
    } as any;
  }

  async findAll(): Promise<ProductEntity[]> {
    const repo = AppDataSource.getRepository(ProductEntity);
    
    // Usar QueryBuilder para hacer JOIN con seller, inventory, category y subcategory
    // Y calcular el rating promedio desde product_order
    const products = await repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .leftJoinAndMapOne(
        'product.seller',
        'seller',
        'seller',
        'seller.id_seller = product.id_seller'
      )
      .leftJoinAndMapOne(
        'product.category',
        'category',
        'category',
        'category.id_category = product.id_category'
      )
      .leftJoinAndMapOne(
        'product.subCategory',
        'sub_category',
        'sub_category',
        'sub_category.id_sub_category = product.id_sub_category'
      )
      .leftJoin('product_order', 'po', 'po.id_product = product.id_product AND po.rating IS NOT NULL')
      .addSelect('COALESCE(AVG(po.rating), 0)', 'product_avg_rating')
      .addSelect('COUNT(po.rating)', 'product_review_count')
      .groupBy('product.id_product')
      .addGroupBy('inventory.id_inventory')
      .addGroupBy('seller.id_seller')
      .addGroupBy('category.id_category')
      .addGroupBy('sub_category.id_sub_category')
      .getRawAndEntities();
    
    // Mapear los resultados raw (avg_rating, review_count) a las entidades
    return products.entities.map((product, index) => {
      const rawData = products.raw[index];
      return {
        ...product,
        avgRating: parseFloat(rawData.product_avg_rating) || 0,
        reviewCount: parseInt(rawData.product_review_count) || 0
      } as any;
    });
  }

  // DELETE con async/await
  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(ProductEntity);
    const productId = parseInt(id, 10);
    const result = await repo.delete(productId);
    return !!result.affected && result.affected > 0;
  }
}
