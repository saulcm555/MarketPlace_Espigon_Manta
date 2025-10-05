import { Inventory } from "@domain/entities/inventory";
import { IInventoryRepository } from "@domain/repositories/IInventoryRepository";

export class InventoryRepositoryImpl implements IInventoryRepository {
  private inventories: Inventory[] = [];
  private currentId = 1;

  create(
    inventory: Inventory,
    callback: (error: Error | null, result?: Inventory) => void
  ): void {
    try {
      if (!inventory.id_seller) {
        return callback(new Error("Inventory must have seller."));
      }
      const newInventory: Inventory = {
        ...inventory,
        id_inventory: this.currentId++,
        updated_at: new Date(),
      };
      this.inventories.push(newInventory);
      callback(null, newInventory);
    } catch (error) {
      callback(error as Error);
    }
  }

  async update(id: string, data: Partial<Inventory>): Promise<Inventory> {
    const inventoryId = parseInt(id, 10);
    const index = this.inventories.findIndex((i) => i.id_inventory === inventoryId);
    if (index === -1) {
      throw new Error(`Inventory with id ${id} not found`);
    }
    this.inventories[index] = {
      ...this.inventories[index]!,
      ...data,
    };
    return this.inventories[index]!;
  }

  async findById(id: string): Promise<Inventory | null> {
    const inventoryId = parseInt(id, 10);
    const inventory = this.inventories.find((i) => i.id_inventory === inventoryId);
    return inventory || null;
  }

  async findAll(): Promise<Inventory[]> {
    return this.inventories;
  }

  async delete(id: string): Promise<boolean> {
    const inventoryId = parseInt(id, 10);
    const index = this.inventories.findIndex((i) => i.id_inventory === inventoryId);
    if (index === -1) {
      return false;
    }
    this.inventories.splice(index, 1);
    return true;
  }
}
