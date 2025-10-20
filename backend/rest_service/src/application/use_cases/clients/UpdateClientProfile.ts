import { UpdateClientProfileDto } from "../../dtos/clients/UpdateClientProfile.dto";
import { ClientService } from "../../../domain/services/ClientService";
import { Client } from "../../../domain/entities/client";

/**
 * Caso de uso para actualizar el perfil de un cliente en el marketplace
 * Permite modificar los datos de un cliente existente
 */
export class UpdateClientProfile {
  constructor(private clientService: ClientService) {}

  /**
   * Ejecuta la actualización del perfil del cliente
   * @param updateData - Datos a actualizar del cliente
   * @returns Promise con el cliente actualizado
   */
  async execute(updateData: UpdateClientProfileDto): Promise<Client> {
    // Validar que el ID esté presente
    if (!updateData.id_client) {
      throw new Error("El ID del cliente es requerido");
    }

    // Verificar que el cliente exista
    const existingClient = await this.clientService.getClientById(
      updateData.id_client.toString()
    );

    if (!existingClient) {
      throw new Error(`Cliente con ID ${updateData.id_client} no encontrado`);
    }

    // Construir objeto con solo los campos que se van a actualizar
    const dataToUpdate: Partial<Client> = {};

    if (updateData.client_name !== undefined) {
      if (updateData.client_name.length < 3) {
        throw new Error("El nombre debe tener al menos 3 caracteres");
      }
      dataToUpdate.client_name = updateData.client_name;
    }

    if (updateData.client_email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.client_email)) {
        throw new Error("Formato de email inválido");
      }
      dataToUpdate.client_email = updateData.client_email;
    }

    if (updateData.client_password !== undefined) {
      if (updateData.client_password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }
      // En producción, deberías hashear la contraseña
      dataToUpdate.client_password = updateData.client_password;
    }

    if (updateData.address !== undefined) {
      if (updateData.address.length < 3) {
        throw new Error("La dirección debe tener al menos 3 caracteres");
      }
      dataToUpdate.address = updateData.address;
    }

    if (updateData.phone !== undefined) {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(updateData.phone)) {
        throw new Error("Formato de teléfono inválido");
      }
      dataToUpdate.phone = updateData.phone;
    }

    if (updateData.document_type !== undefined) {
      dataToUpdate.document_type = updateData.document_type;
    }

    if (updateData.document_number !== undefined) {
      dataToUpdate.document_number = updateData.document_number;
    }

    if (updateData.birth_date !== undefined) {
      const birthDate = new Date(updateData.birth_date);
      if (isNaN(birthDate.getTime())) {
        throw new Error("Formato de fecha de nacimiento inválido");
      }
      dataToUpdate.birth_date = birthDate;
    }

    if (updateData.avatar_url !== undefined) {
      dataToUpdate.avatar_url = updateData.avatar_url;
    }

    if (updateData.additional_addresses !== undefined) {
      dataToUpdate.additional_addresses = JSON.stringify(updateData.additional_addresses);
    }

    // Si no hay campos para actualizar
    if (Object.keys(dataToUpdate).length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    // Actualizar el cliente
    const updatedClient = await this.clientService.updateClient(
      updateData.id_client.toString(),
      dataToUpdate
    );

    // Retornar cliente sin la contraseña
    const { client_password, ...clientWithoutPassword } = updatedClient;
    return clientWithoutPassword as Client;
  }
}
