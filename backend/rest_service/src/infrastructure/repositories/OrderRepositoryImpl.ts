import { IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { OrderEntity, ProductOrderEntity } from "../../models/orderModel";
import AppDataSource from "../database/data-source";
import { Not, IsNull } from "typeorm";

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
    return await repo.findOne({
      where: { id_order: orderId },
      relations: ["productOrders", "productOrders.product"]
    });
  }

  async findAll(): Promise<OrderEntity[]> {
    const repo = AppDataSource.getRepository(OrderEntity);
    return await repo.find({
  relations: ["productOrders", "productOrders.product", "cart", "cart.productCarts", "cart.productCarts.product", "paymentMethod"]
    });
  }

  async findByStatus(status: string): Promise<OrderEntity[]> {
    const repo = AppDataSource.getRepository(OrderEntity);
    return await repo.find({
      where: { status },
  relations: ["productOrders", "productOrders.product", "cart", "cart.productCarts", "cart.productCarts.product", "paymentMethod"]
    });
  }

  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(OrderEntity);
    const orderId = parseInt(id, 10);
    const result = await repo.delete(orderId);
    return !!result.affected && result.affected > 0;
  }

  async addReview(id_product_order: number, rating: number, review_comment?: string): Promise<ProductOrderEntity> {
    const repo = AppDataSource.getRepository(ProductOrderEntity);
    
    const updateData: any = {
      rating,
      reviewed_at: new Date()
    };
    
    if (review_comment !== undefined) {
      updateData.review_comment = review_comment;
    }
    
    await repo.update(id_product_order, updateData);
    
    const updated = await repo.findOne({
      where: { id_product_order },
      relations: ["product"]
    });
    
    if (!updated) throw new Error(`ProductOrder with id ${id_product_order} not found`);
    return updated;
  }

  async getProductReviews(id_product: number): Promise<ProductOrderEntity[]> {
    const repo = AppDataSource.getRepository(ProductOrderEntity);
    
    return await repo.find({
      where: { 
        id_product,
        rating: Not(IsNull())
      },
      relations: ["order"],
      order: {
        reviewed_at: "DESC"
      }
    });
  }
}
