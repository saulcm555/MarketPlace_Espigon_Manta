import { IProductRepository } from "../domain/repositories/IProductRepository";
import { ProductEntity } from "../models/productModel";
import AppDataSource from "../data-source";

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
    return await repo.findOneBy({ id_product: productId });
  }

  async findAll(): Promise<ProductEntity[]> {
    const repo = AppDataSource.getRepository(ProductEntity);
    return await repo.find();
  }

  // DELETE con async/await
  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(ProductEntity);
    const productId = parseInt(id, 10);
    const result = await repo.delete(productId);
    return !!result.affected && result.affected > 0;
  }
}
