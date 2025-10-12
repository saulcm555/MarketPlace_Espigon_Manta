import { RegisterClientDto } from "../../dtos/clients/RegisterClient.dto";
import { ClientService } from "../../../domain/services/ClientService";
import { Client } from "../../../domain/entities/client";

/**
 * Caso de uso para el registro de nuevos clientes en el marketplace
 * Crea un nuevo cliente con sus datos básicos y opcionales
 */
export class RegisterClient {
  constructor(private clientService: ClientService) {}

  /**
   * Ejecuta el registro de un nuevo cliente
   * @param registerData - Datos del nuevo cliente a registrar
   * @returns Promise con el cliente creado
   */
  async execute(registerData: RegisterClientDto): Promise<Client> {
    return new Promise((resolve, reject) => {
      // Validar datos requeridos
      if (
        !registerData.client_name ||
        !registerData.client_email ||
        !registerData.client_password ||
        !registerData.address
      ) {
        reject(new Error("Todos los campos obligatorios son requeridos"));
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerData.client_email)) {
        reject(new Error("Formato de email inválido"));
        return;
      }

      // Validar longitud de contraseña
      if (registerData.client_password.length < 6) {
        reject(new Error("La contraseña debe tener al menos 6 caracteres"));
        return;
      }

      // Validar longitud del nombre
      if (registerData.client_name.length < 3) {
        reject(new Error("El nombre debe tener al menos 3 caracteres"));
        return;
      }

      // Validar teléfono si se proporciona
      if (registerData.phone) {
        const phoneRegex = /^[\d\s\+\-\(\)]+$/;
        if (!phoneRegex.test(registerData.phone)) {
          reject(new Error("Formato de teléfono inválido"));
          return;
        }
      }

      // Validar fecha de nacimiento si se proporciona
      if (registerData.birth_date) {
        const birthDate = new Date(registerData.birth_date);
        if (isNaN(birthDate.getTime())) {
          reject(new Error("Formato de fecha de nacimiento inválido"));
          return;
        }
        // Verificar que sea mayor de edad (18 años)
        const age = this.calculateAge(birthDate);
        if (age < 18) {
          reject(new Error("Debes ser mayor de 18 años para registrarte"));
          return;
        }
      }

      // Crear el cliente (en producción, deberías hashear la contraseña)
      const clientData: Partial<Client> = {
        client_name: registerData.client_name,
        client_email: registerData.client_email,
        client_password: registerData.client_password, // En producción: bcrypt.hash()
        address: registerData.address,
      };

      // Agregar campos opcionales solo si están presentes
      if (registerData.phone) {
        clientData.phone = registerData.phone;
      }
      if (registerData.document_type) {
        clientData.document_type = registerData.document_type;
      }
      if (registerData.document_number) {
        clientData.document_number = registerData.document_number;
      }
      if (registerData.birth_date) {
        clientData.birth_date = new Date(registerData.birth_date);
      }
      if (registerData.avatar_url) {
        clientData.avatar_url = registerData.avatar_url;
      }
      if (registerData.additional_addresses) {
        clientData.additional_addresses = JSON.stringify(registerData.additional_addresses);
      }

      this.clientService.createClient(clientData as Client, (error, result) => {
        if (error) {
          reject(error);
        } else {
          // Retornar cliente sin la contraseña
          if (result) {
            const { client_password, ...clientWithoutPassword } = result;
            resolve(clientWithoutPassword as Client);
          } else {
            reject(new Error("Error al crear el cliente"));
          }
        }
      });
    });
  }

  /**
   * Calcula la edad a partir de una fecha de nacimiento
   * @param birthDate - Fecha de nacimiento
   * @returns Edad en años
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}
