import { Seller } from "@domain/entities/seller";
import { ISellerRepository } from "@domain/repositories/ISellerRepository";

export class SellerService {
  constructor(private sellerRepository: ISellerRepository) {}

  createSeller(seller: Seller, callback: (err: Error | null, result?: Seller) => void): void {
    this.sellerRepository.create(seller, callback);
  }

  updateSeller(id: string, data: Partial<Seller>): Promise<Seller> {
    return this.sellerRepository.update(id, data);
  }

  async getSellerById(id: string): Promise<Seller | null> {
    return await this.sellerRepository.findById(id);
  }

  async getAllSellers(): Promise<Seller[]> {
    return await this.sellerRepository.findAll();
  }

  async deleteSeller(id: string): Promise<boolean> {
    return await this.sellerRepository.delete(id);
  }
}
