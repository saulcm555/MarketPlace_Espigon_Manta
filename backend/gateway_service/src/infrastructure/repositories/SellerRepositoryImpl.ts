import { ISellerRepository } from "../domain/repositories/ISellerRepository";
import { SellerEntity } from "../models/sellerModel";
import AppDataSource from "../data-source";

export class SellerRepositoryImpl implements ISellerRepository {
  create(
    seller: Partial<SellerEntity>,
    callback: (error: Error | null, result?: SellerEntity) => void
  ): void {
    const repo = AppDataSource.getRepository(SellerEntity);
    const newSeller = repo.create(seller);
    repo
      .save(newSeller)
      .then((saved) => callback(null, saved))
      .catch((err) => callback(err));
  }

  async update(id: string, data: Partial<SellerEntity>): Promise<SellerEntity> {
    const repo = AppDataSource.getRepository(SellerEntity);
    const sellerId = parseInt(id, 10);
    await repo.update(sellerId, data);
    const updated = await repo.findOneBy({ id_seller: sellerId });
    if (!updated) throw new Error(`Seller with id ${id} not found`);
    return updated;
  }

  async findById(id: string): Promise<SellerEntity | null> {
    const repo = AppDataSource.getRepository(SellerEntity);
    const sellerId = parseInt(id, 10);
    return await repo.findOneBy({ id_seller: sellerId });
  }

  async findAll(): Promise<SellerEntity[]> {
    const repo = AppDataSource.getRepository(SellerEntity);
    return await repo.find();
  }

  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(SellerEntity);
    const sellerId = parseInt(id, 10);
    const result = await repo.delete(sellerId);
    return !!result.affected && result.affected > 0;
  }
}
