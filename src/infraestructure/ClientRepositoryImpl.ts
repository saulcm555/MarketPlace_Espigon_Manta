import { Client } from "@domain/entities/client";
import { IClientRepository } from "@domain/repositories/IClientRepository";

export class ClientRepositoryImpl implements IClientRepository {
  private clients: Client[] = [];
  private currentId = 1;

  create(
    client: Client,
    callback: (error: Error | null, result?: Client) => void
  ): void {
    try {
      if (!client.client_name || !client.client_email) {
        return callback(new Error("Client must have a name and email."));
      }
      const newClient: Client = {
        ...client,
        id_client: this.currentId++,
        created_at: new Date(),
      };
      this.clients.push(newClient);
      callback(null, newClient);
    } catch (error) {
      callback(error as Error);
    }
  }

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const clientId = parseInt(id, 10);
    const index = this.clients.findIndex((c) => c.id_client === clientId);
    if (index === -1) {
      throw new Error(`Client with id ${id} not found`);
    }
    this.clients[index] = {
      ...this.clients[index]!,
      ...data,
    };
    return this.clients[index]!;
  }

  async findById(id: string): Promise<Client | null> {
    const clientId = parseInt(id, 10);
    const client = this.clients.find((c) => c.id_client === clientId);
    return client || null;
  }

  async findAll(): Promise<Client[]> {
    return this.clients;
  }

  async delete(id: string): Promise<boolean> {
    const clientId = parseInt(id, 10);
    const index = this.clients.findIndex((c) => c.id_client === clientId);
    if (index === -1) {
      return false;
    }
    this.clients.splice(index, 1);
    return true;
  }
}
