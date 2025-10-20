import { LoginClientDto } from "../../dtos/clients/LoginClient.dto";
import { ClientService } from "../../../domain/services/ClientService";
import { Client } from "../../../domain/entities/client";

/**
 * Caso de uso para el login de clientes en el marketplace
 * Valida las credenciales del cliente y retorna su información
 */
export class LoginClient {
  constructor(private clientService: ClientService) {}

  /**
   * Ejecuta el login del cliente
   * @param loginData - Datos de login del cliente (email y password)
   * @returns Promise con los datos del cliente autenticado
   */
  async execute(loginData: LoginClientDto): Promise<Client | null> {
    // Validar que el email y password estén presentes
    if (!loginData.client_email || !loginData.client_password) {
      throw new Error("Email y contraseña son requeridos");
    }

    // Buscar todos los clientes (en un escenario real, deberías tener un método findByEmail)
    const clients = await this.clientService.getAllClients();
    
    // Buscar el cliente por email
    const client = clients.find(
      (c) => c.client_email === loginData.client_email
    );

    if (!client) {
      throw new Error("Credenciales inválidas");
    }

    // Validar contraseña (en producción, deberías usar bcrypt para comparar hashes)
    if (client.client_password !== loginData.client_password) {
      throw new Error("Credenciales inválidas");
    }

    // Retornar cliente sin la contraseña
    const { client_password, ...clientWithoutPassword } = client;
    return clientWithoutPassword as Client;
  }
}
