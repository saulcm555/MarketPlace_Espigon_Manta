import { Client } from "@domain/entities/client";
import { IClientRepository } from "@domain/repositories/IClientRepository";

export class ClientService {
  constructor(private clientRepository: IClientRepository) {}

  createClient(client: Client, callback: (err: Error | null, result?: Client) => void): void {
    this.clientRepository.create(client, callback);
  }

  updateClient(id: string, data: Partial<Client>): Promise<Client> {
    return this.clientRepository.update(id, data);
  }

  async getClientById(id: string): Promise<Client | null> {
    return await this.clientRepository.findById(id);
  }

  async getAllClients(): Promise<Client[]> {
    return await this.clientRepository.findAll();
  }

  async deleteClient(id: string): Promise<boolean> {
    return await this.clientRepository.delete(id);
  }
}
