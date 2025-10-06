import { IClientRepository } from "../domain/repositories/IClientRepository";
import { ClientEntity } from "../models/clientModel";
import AppDataSource from "../data-source";

export class ClientRepositoryImpl implements IClientRepository {
  create(
    client: Partial<ClientEntity>,
    callback: (error: Error | null, result?: ClientEntity) => void
  ): void {
    const repo = AppDataSource.getRepository(ClientEntity);
    const newClient = repo.create(client);
    repo
      .save(newClient)
      .then((saved) => callback(null, saved))
      .catch((err) => callback(err));
  }

  async update(id: string, data: Partial<ClientEntity>): Promise<ClientEntity> {
    const repo = AppDataSource.getRepository(ClientEntity);
    const clientId = parseInt(id, 10);
    await repo.update(clientId, data);
    const updated = await repo.findOneBy({ id_client: clientId });
    if (!updated) throw new Error(`Client with id ${id} not found`);
    return updated;
  }

  async findById(id: string): Promise<ClientEntity | null> {
    const repo = AppDataSource.getRepository(ClientEntity);
    const clientId = parseInt(id, 10);
    return await repo.findOneBy({ id_client: clientId });
  }

  async findAll(): Promise<ClientEntity[]> {
    const repo = AppDataSource.getRepository(ClientEntity);
    return await repo.find();
  }

  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(ClientEntity);
    const clientId = parseInt(id, 10);
    const result = await repo.delete(clientId);
    return !!result.affected && result.affected > 0;
  }
}
