import { Cart } from "@domain/entities/cart";
import { ICartRepository } from "@domain/repositories/ICartRepository";

export class CartService {
  constructor(private cartRepository: ICartRepository) {}

  async createCart(cart: Cart): Promise<Cart> {
    return await this.cartRepository.create(cart);
  }

  updateCart(id: string, data: Partial<Cart>): Promise<Cart> {
    return this.cartRepository.update(id, data);
  }

  async getCartById(id: string): Promise<Cart | null> {
    return await this.cartRepository.findById(id);
  }

  async getAllCarts(): Promise<Cart[]> {
    return await this.cartRepository.findAll();
  }

  async deleteCart(id: string): Promise<boolean> {
    return await this.cartRepository.delete(id);
  }
}
