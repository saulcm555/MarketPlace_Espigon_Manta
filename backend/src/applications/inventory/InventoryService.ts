import { Inventory } from "@domain/entities/inventory";
import { IInventoryRepository } from "@domain/repositories/IInventoryRepository";

export class InventoryService {
  constructor(private inventoryRepository: IInventoryRepository) {}

  createInventory(inventory: Inventory, callback: (err: Error | null, result?: Inventory) => void): void {
    this.inventoryRepository.create(inventory, callback);
  }

  updateInventory(id: string, data: Partial<Inventory>): Promise<Inventory> {
    return this.inventoryRepository.update(id, data);
  }

  async getInventoryById(id: string): Promise<Inventory | null> {
    return await this.inventoryRepository.findById(id);
  }

  async getAllInventories(): Promise<Inventory[]> {
    return await this.inventoryRepository.findAll();
  }

  async deleteInventory(id: string): Promise<boolean> {
    return await this.inventoryRepository.delete(id);
  }
}
