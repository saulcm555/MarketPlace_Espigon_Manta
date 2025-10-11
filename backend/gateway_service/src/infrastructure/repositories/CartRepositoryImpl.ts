import { ICartRepository } from "../domain/repositories/ICartRepository";
import { CartEntity } from "../models/cartModel";
import AppDataSource from "../data-source";

export class CartRepositoryImpl implements ICartRepository {
  create(
    cart: Partial<CartEntity>,
    callback: (error: Error | null, result?: CartEntity) => void
  ): void {
    const repo = AppDataSource.getRepository(CartEntity);
    const newCart = repo.create(cart);
    repo
      .save(newCart)
      .then((saved) => callback(null, saved))
      .catch((err) => callback(err));
  }

  async update(id: string, data: Partial<CartEntity>): Promise<CartEntity> {
    const repo = AppDataSource.getRepository(CartEntity);
    const cartId = parseInt(id, 10);
    await repo.update(cartId, data);
    const updated = await repo.findOneBy({ id_cart: cartId });
    if (!updated) throw new Error(`Cart with id ${id} not found`);
    return updated;
  }

  async findById(id: string): Promise<CartEntity | null> {
    const repo = AppDataSource.getRepository(CartEntity);
    const cartId = parseInt(id, 10);
    return await repo.findOneBy({ id_cart: cartId });
  }

  async findAll(): Promise<CartEntity[]> {
    const repo = AppDataSource.getRepository(CartEntity);
    return await repo.find();
  }

  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(CartEntity);
    const cartId = parseInt(id, 10);
    const result = await repo.delete(cartId);
    return !!result.affected && result.affected > 0;
  }
}
