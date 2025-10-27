/*** Tipos y interfaces compartidas para los DTOs de clientes */
/*** Interfaz para direcciones adicionales del cliente
 ** Permite gestionar múltiples direcciones (casa, trabajo, etc.)*/

export interface AdditionalAddress {
  type: string; // 'casa', 'trabajo', 'oficina', 'otro'
  address: string;
  reference?: string; // Referencia o punto de ubicación (ej: "Frente al parque")
  is_default?: boolean; // Si es la dirección predeterminada para entregas
}

/**
 * Tipos de documentos de identidad válidos
 */
export type DocumentType = 'cedula' | 'dni' | 'pasaporte' | 'ruc' | 'otro';

/**
 * Tipos de direcciones válidas
 */
export type AddressType = 'casa' | 'trabajo' | 'oficina' | 'otro';
