import { IOrderRepository } from "../domain/repositories/IOrderRepository";
import { OrderEntity } from "../models/orderModel";
import AppDataSource from "../data-source";

export class OrderRepositoryImpl implements IOrderRepository {
  create(
    order: Partial<OrderEntity>,
    callback: (error: Error | null, result?: OrderEntity) => void
  ): void {
    const repo = AppDataSource.getRepository(OrderEntity);
    const newOrder = repo.create(order);
    repo
      .save(newOrder)
      .then((saved) => callback(null, saved))
      .catch((err) => callback(err));
  }

  async update(id: string, data: Partial<OrderEntity>): Promise<OrderEntity> {
    const repo = AppDataSource.getRepository(OrderEntity);
    const orderId = parseInt(id, 10);
    await repo.update(orderId, data);
    const updated = await repo.findOneBy({ id_order: orderId });
    if (!updated) throw new Error(`Order with id ${id} not found`);
    return updated;
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const repo = AppDataSource.getRepository(OrderEntity);
    const orderId = parseInt(id, 10);
    return await repo.findOneBy({ id_order: orderId });
  }

  async findAll(): Promise<OrderEntity[]> {
    const repo = AppDataSource.getRepository(OrderEntity);
    return await repo.find();
  }

  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(OrderEntity);
    const orderId = parseInt(id, 10);
    const result = await repo.delete(orderId);
    return !!result.affected && result.affected > 0;
  }
}
