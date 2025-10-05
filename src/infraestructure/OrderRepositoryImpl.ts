import { Order } from "@domain/entities/order";
import { IOrderRepository } from "@domain/repositories/IOrderRepository";

export class OrderRepositoryImpl implements IOrderRepository {
  private orders: Order[] = [];
  private currentId = 1;

  create(
    order: Order,
    callback: (error: Error | null, result?: Order) => void
  ): void {
    try {
      if (!order.id_client || !order.id_cart || !order.id_payment_method) {
        return callback(new Error("Order must have client, cart and payment method."));
      }
      const newOrder: Order = {
        ...order,
        id_order: this.currentId++,
        order_date: new Date(),
      };
      this.orders.push(newOrder);
      callback(null, newOrder);
    } catch (error) {
      callback(error as Error);
    }
  }

  async update(id: string, data: Partial<Order>): Promise<Order> {
    const orderId = parseInt(id, 10);
    const index = this.orders.findIndex((o) => o.id_order === orderId);
    if (index === -1) {
      throw new Error(`Order with id ${id} not found`);
    }
    this.orders[index] = {
      ...this.orders[index]!,
      ...data,
    };
    return this.orders[index]!;
  }

  async findById(id: string): Promise<Order | null> {
    const orderId = parseInt(id, 10);
    const order = this.orders.find((o) => o.id_order === orderId);
    return order || null;
  }

  async findAll(): Promise<Order[]> {
    return this.orders;
  }

  async delete(id: string): Promise<boolean> {
    const orderId = parseInt(id, 10);
    const index = this.orders.findIndex((o) => o.id_order === orderId);
    if (index === -1) {
      return false;
    }
    this.orders.splice(index, 1);
    return true;
  }
}
