import { AdditionalAddress, DocumentType } from './types';

export interface RegisterClientDto {
  // Campos requeridos
  client_name: string;
  client_email: string;
  client_password: string;
  address: string;
  birth_date: string; // Formato: 'YYYY-MM-DD'

  // Campos opcionales
  phone?: string;
  document_type?: DocumentType;
  document_number?: string;
  avatar_url?: string;
  additional_addresses?: AdditionalAddress[]; 
}
