import { Seller } from "@domain/entities/seller";
import { ISellerRepository } from "@domain/repositories/ISellerRepository";

export class SellerRepositoryImpl implements ISellerRepository {
  private sellers: Seller[] = [];
  private currentId = 1;

  create(
    seller: Seller,
    callback: (error: Error | null, result?: Seller) => void
  ): void {
    try {
      if (!seller.seller_name || !seller.seller_email) {
        return callback(new Error("Seller must have a name and email."));
      }
      const newSeller: Seller = {
        ...seller,
        id_seller: this.currentId++,
        created_at: new Date(),
      };
      this.sellers.push(newSeller);
      callback(null, newSeller);
    } catch (error) {
      callback(error as Error);
    }
  }

  async update(id: string, data: Partial<Seller>): Promise<Seller> {
    const sellerId = parseInt(id, 10);
    const index = this.sellers.findIndex((s) => s.id_seller === sellerId);
    if (index === -1) {
      throw new Error(`Seller with id ${id} not found`);
    }
    this.sellers[index] = {
      ...this.sellers[index]!,
      ...data,
    };
    return this.sellers[index]!;
  }

  async findById(id: string): Promise<Seller | null> {
    const sellerId = parseInt(id, 10);
    const seller = this.sellers.find((s) => s.id_seller === sellerId);
    return seller || null;
  }

  async findAll(): Promise<Seller[]> {
    return this.sellers;
  }

  async delete(id: string): Promise<boolean> {
    const sellerId = parseInt(id, 10);
    const index = this.sellers.findIndex((s) => s.id_seller === sellerId);
    if (index === -1) {
      return false;
    }
    this.sellers.splice(index, 1);
    return true;
  }
}
