import { Cart } from "@domain/entities/cart";
import { ICartRepository } from "@domain/repositories/ICartRepository";

export class CartRepositoryImpl implements ICartRepository {
  private carts: Cart[] = [];
  private currentId = 1;

  create(
    cart: Cart,
    callback: (error: Error | null, result?: Cart) => void
  ): void {
    try {
      if (!cart.id_client || !cart.id_product || !cart.quantity) {
        return callback(new Error("Cart must have client, product and quantity."));
      }
      const newCart: Cart = {
        ...cart,
        id_cart: this.currentId++,
      };
      this.carts.push(newCart);
      callback(null, newCart);
    } catch (error) {
      callback(error as Error);
    }
  }

  async update(id: string, data: Partial<Cart>): Promise<Cart> {
    const cartId = parseInt(id, 10);
    const index = this.carts.findIndex((c) => c.id_cart === cartId);
    if (index === -1) {
      throw new Error(`Cart with id ${id} not found`);
    }
    this.carts[index] = {
      ...this.carts[index]!,
      ...data,
    };
    return this.carts[index]!;
  }

  async findById(id: string): Promise<Cart | null> {
    const cartId = parseInt(id, 10);
    const cart = this.carts.find((c) => c.id_cart === cartId);
    return cart || null;
  }

  async findAll(): Promise<Cart[]> {
    return this.carts;
  }

  async delete(id: string): Promise<boolean> {
    const cartId = parseInt(id, 10);
    const index = this.carts.findIndex((c) => c.id_cart === cartId);
    if (index === -1) {
      return false;
    }
    this.carts.splice(index, 1);
    return true;
  }
}
