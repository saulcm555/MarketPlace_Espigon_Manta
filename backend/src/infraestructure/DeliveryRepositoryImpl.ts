import { IDeliveryRepository } from "../domain/repositories/IDeliveryRepository";
import { DeliveryEntity } from "../models/deliveryModel";
import AppDataSource from "../data-source";

export class DeliveryRepositoryImpl implements IDeliveryRepository {
  create(
    delivery: Partial<DeliveryEntity>,
    callback: (error: Error | null, result?: DeliveryEntity) => void
  ): void {
    const repo = AppDataSource.getRepository(DeliveryEntity);
    const newDelivery = repo.create(delivery);
    repo
      .save(newDelivery)
      .then((saved) => callback(null, saved))
      .catch((err) => callback(err));
  }

  async update(id: string, data: Partial<DeliveryEntity>): Promise<DeliveryEntity> {
    const repo = AppDataSource.getRepository(DeliveryEntity);
    const deliveryId = parseInt(id, 10);
    await repo.update(deliveryId, data);
    const updated = await repo.findOneBy({ id_delivery: deliveryId });
    if (!updated) throw new Error(`Delivery with id ${id} not found`);
    return updated;
  }

  async findById(id: string): Promise<DeliveryEntity | null> {
    const repo = AppDataSource.getRepository(DeliveryEntity);
    const deliveryId = parseInt(id, 10);
    return await repo.findOneBy({ id_delivery: deliveryId });
  }

  async findAll(): Promise<DeliveryEntity[]> {
    const repo = AppDataSource.getRepository(DeliveryEntity);
    return await repo.find();
  }

  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(DeliveryEntity);
    const deliveryId = parseInt(id, 10);
    const result = await repo.delete(deliveryId);
    return !!result.affected && result.affected > 0;
  }
}
