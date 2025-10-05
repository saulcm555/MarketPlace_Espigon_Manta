import { Product } from "@domain/entities/product";
import { IProductRepository } from "@domain/repositories/IProductRepository";

// Repositorio en memoria
export class ProductRepositoryImpl implements IProductRepository {
  private products: Product[] = [];
  private currentId = 1;

  // CREATE con Callback
  create(
    product: Product,
    callback: (error: Error | null, result?: Product) => void
  ): void {
    try {
      // Validación simple
      if (!product.product_name || !product.price) {
        return callback(new Error("Product must have a name and price."));
      }

      const newProduct: Product = {
        ...product,
        id_product: this.currentId++,
        created_at: new Date(),
      } as Product; // <-- fix: assertion

      this.products.push(newProduct);
      callback(null, newProduct);
    } catch (error) {
      callback(error as Error);
    }
  }

  // UPDATE con Promise
  async update(id: string, data: Partial<Product>): Promise<Product> {
    const productId = parseInt(id, 10);
    const index = this.products.findIndex((p) => p.id_product === productId);

    if (index === -1) {
      throw new Error(`Product with id ${id} not found`);
    }

    this.products[index] = {
      ...this.products[index]!,
      ...data,
    };

    return this.products[index]!; // <-- fix: non-null assertion
  }

  // READ con async/await
  async findById(id: string): Promise<Product | null> {
    const productId = parseInt(id, 10);
    const product = this.products.find((p) => p.id_product === productId);
    return product || null;
  }

  async findAll(): Promise<Product[]> {
    return this.products;
  }

  // DELETE con async/await
  async delete(id: string): Promise<boolean> {
    const productId = parseInt(id, 10);
    const index = this.products.findIndex((p) => p.id_product === productId);

    if (index === -1) {
      return false;
    }

    this.products.splice(index, 1);
    return true;
  }
}
