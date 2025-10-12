import { AdditionalAddress, DocumentType } from './types';

/**
 * DTO para actualizar el perfil de un cliente en el marketplace
 */
export interface UpdateClientProfileDto {
  id_client: number;
  
  // Campos opcionales para actualizar
  client_name?: string;
  client_email?: string;
  client_password?: string;
  address?: string;
  phone?: string;
  document_type?: DocumentType;
  document_number?: string;
  birth_date?: string; // Formato: 'YYYY-MM-DD'
  avatar_url?: string;
  additional_addresses?: AdditionalAddress[]; // Array de direcciones adicionales
}
