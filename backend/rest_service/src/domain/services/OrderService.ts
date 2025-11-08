import { Order } from "@domain/entities/order";
import { IOrderRepository } from "@domain/repositories/IOrderRepository";

export class OrderService {
  constructor(private orderRepository: IOrderRepository) {}

  createOrder(order: Order, callback: (err: Error | null, result?: Order) => void): void {
    this.orderRepository.create(order, callback);
  }

  updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    return this.orderRepository.update(id, data);
  }

  async getOrderById(id: string): Promise<Order | null> {
    return await this.orderRepository.findById(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return await this.orderRepository.findAll();
  }

  async deleteOrder(id: string): Promise<boolean> {
    return await this.orderRepository.delete(id);
  }

  async addReviewToProductOrder(id_product_order: number, rating: number, review_comment?: string): Promise<any> {
    return await this.orderRepository.addReview(id_product_order, rating, review_comment);
  }

  async getProductReviews(id_product: number): Promise<any[]> {
    return await this.orderRepository.getProductReviews(id_product);
  }
}
