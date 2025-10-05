import { Delivery } from "@domain/entities/delivery";
import { IDeliveryRepository } from "@domain/repositories/IDeliveryRepository";

export class DeliveryRepositoryImpl implements IDeliveryRepository {
  private deliveries: Delivery[] = [];
  private currentId = 1;

  create(
    delivery: Delivery,
    callback: (error: Error | null, result?: Delivery) => void
  ): void {
    try {
      if (!delivery.delivery_address || !delivery.city) {
        return callback(new Error("Delivery must have address and city."));
      }
      const newDelivery: Delivery = {
        ...delivery,
        id_delivery: this.currentId++,
        estimated_time: new Date(),
      };
      this.deliveries.push(newDelivery);
      callback(null, newDelivery);
    } catch (error) {
      callback(error as Error);
    }
  }

  async update(id: string, data: Partial<Delivery>): Promise<Delivery> {
    const deliveryId = parseInt(id, 10);
    const index = this.deliveries.findIndex((d) => d.id_delivery === deliveryId);
    if (index === -1) {
      throw new Error(`Delivery with id ${id} not found`);
    }
    this.deliveries[index] = {
      ...this.deliveries[index]!,
      ...data,
    };
    return this.deliveries[index]!;
  }

  async findById(id: string): Promise<Delivery | null> {
    const deliveryId = parseInt(id, 10);
    const delivery = this.deliveries.find((d) => d.id_delivery === deliveryId);
    return delivery || null;
  }

  async findAll(): Promise<Delivery[]> {
    return this.deliveries;
  }

  async delete(id: string): Promise<boolean> {
    const deliveryId = parseInt(id, 10);
    const index = this.deliveries.findIndex((d) => d.id_delivery === deliveryId);
    if (index === -1) {
      return false;
    }
    this.deliveries.splice(index, 1);
    return true;
  }
}
