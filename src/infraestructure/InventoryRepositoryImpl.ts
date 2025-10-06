import { IInventoryRepository } from "../domain/repositories/IInventoryRepository";
import { InventoryEntity } from "../models/inventoryModel";
import AppDataSource from "../data-source";

export class InventoryRepositoryImpl implements IInventoryRepository {
  create(
    inventory: Partial<InventoryEntity>,
    callback: (error: Error | null, result?: InventoryEntity) => void
  ): void {
    const repo = AppDataSource.getRepository(InventoryEntity);
    const newInventory = repo.create(inventory);
    repo
      .save(newInventory)
      .then((saved) => callback(null, saved))
      .catch((err) => callback(err));
  }

  async update(id: string, data: Partial<InventoryEntity>): Promise<InventoryEntity> {
    const repo = AppDataSource.getRepository(InventoryEntity);
    const inventoryId = parseInt(id, 10);
    await repo.update(inventoryId, data);
    const updated = await repo.findOneBy({ id_inventory: inventoryId });
    if (!updated) throw new Error(`Inventory with id ${id} not found`);
    return updated;
  }

  async findById(id: string): Promise<InventoryEntity | null> {
    const repo = AppDataSource.getRepository(InventoryEntity);
    const inventoryId = parseInt(id, 10);
    return await repo.findOneBy({ id_inventory: inventoryId });
  }

  async findAll(): Promise<InventoryEntity[]> {
    const repo = AppDataSource.getRepository(InventoryEntity);
    return await repo.find();
  }

  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(InventoryEntity);
    const inventoryId = parseInt(id, 10);
    const result = await repo.delete(inventoryId);
    return !!result.affected && result.affected > 0;
  }
}
