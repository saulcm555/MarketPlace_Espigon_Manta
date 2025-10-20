import { Product } from "@domain/entities/product";
import { IProductRepository } from "@domain/repositories/IProductRepository";

export class ProductService {
  constructor(private productRepository: IProductRepository) {}

  createProduct(product: Product, callback: (err: Error | null, result?: Product) => void): void {
    this.productRepository.create(product, callback);
  }

  updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return this.productRepository.update(id, data);
  }

  async getProductById(id: string): Promise<Product | null> {
    return await this.productRepository.findById(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return await this.productRepository.findAll();
  }

  async deleteProduct(id: string): Promise<boolean> {
    return await this.productRepository.delete(id);
  }
}
