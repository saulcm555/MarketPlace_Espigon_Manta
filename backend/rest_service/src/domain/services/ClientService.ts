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

  async getClientByUserId(userId: string): Promise<Client | null> {
    return await this.clientRepository.findByUserId(userId);
  }

  async getClientByEmail(email: string): Promise<Client | null> {
    return await this.clientRepository.findByEmail(email);
  }

  async findOrLinkClientByUserIdAndEmail(userId: string, email: string): Promise<Client | null> {
    // Primero buscar por user_id
    let client = await this.clientRepository.findByUserId(userId);
    if (client) return client;
    
    // Si no existe, buscar por email
    client = await this.clientRepository.findByEmail(email);
    if (client) {
      // Vincular el user_id al cliente existente
      await this.clientRepository.update(client.id_client.toString(), { user_id: userId });
      client.user_id = userId;
    }
    return client;
  }

  async getAllClients(): Promise<Client[]> {
    return await this.clientRepository.findAll();
  }

  async deleteClient(id: string): Promise<boolean> {
    return await this.clientRepository.delete(id);
  }
}
