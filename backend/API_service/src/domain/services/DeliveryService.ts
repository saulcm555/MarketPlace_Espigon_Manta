import { Delivery } from "@domain/entities/delivery";
import { IDeliveryRepository } from "@domain/repositories/IDeliveryRepository";

export class DeliveryService {
  constructor(private deliveryRepository: IDeliveryRepository) {}

  createDelivery(delivery: Delivery, callback: (err: Error | null, result?: Delivery) => void): void {
    this.deliveryRepository.create(delivery, callback);
  }

  updateDelivery(id: string, data: Partial<Delivery>): Promise<Delivery> {
    return this.deliveryRepository.update(id, data);
  }

  async getDeliveryById(id: string): Promise<Delivery | null> {
    return await this.deliveryRepository.findById(id);
  }

  async getAllDeliveries(): Promise<Delivery[]> {
    return await this.deliveryRepository.findAll();
  }

  async deleteDelivery(id: string): Promise<boolean> {
    return await this.deliveryRepository.delete(id);
  }
}
