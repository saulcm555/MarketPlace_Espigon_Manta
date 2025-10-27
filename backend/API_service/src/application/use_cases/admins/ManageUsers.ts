import {
  GetAllClientsDto,
  GetAllSellersDto,
  ToggleClientStatusDto,
  ToggleSellerStatusDto,
  GetSystemStatsDto,
  SystemStatsResponseDto,
  GetUserByIdDto,
} from "../../dtos/admins/ManageUsers.dto";
import { ClientService } from "../../../domain/services/ClientService";
import { SellerService } from "../../../domain/services/SellerService";
import { Client } from "../../../domain/entities/client";
import { Seller } from "../../../domain/entities/seller";

/**
 * Casos de uso para que el admin gestione usuarios
 */
export class ManageUsers {
  constructor(
    private clientService: ClientService,
    private sellerService: SellerService
  ) {}

  /**
   * Obtener todos los clientes
   */
  async getAllClients(data: GetAllClientsDto): Promise<Client[]> {
    const clients = await this.clientService.getAllClients();
    
    // Aplicar filtros si existen
    let filtered = clients;
    if (data.status) {
      filtered = clients.filter((c: any) => c.status === data.status);
    }

    // Aplicar paginación
    if (data.page && data.limit) {
      const startIndex = (data.page - 1) * data.limit;
      const endIndex = startIndex + data.limit;
      return filtered.slice(startIndex, endIndex);
    }

    return filtered;
  }

  /**
   * Obtener todos los vendedores
   */
  async getAllSellers(data: GetAllSellersDto): Promise<Seller[]> {
    const sellers = await this.sellerService.getAllSellers();
    
    // Aplicar filtros si existen
    let filtered = sellers;
    if (data.status) {
      filtered = sellers.filter((s: any) => s.status === data.status);
    }

    // Aplicar paginación
    if (data.page && data.limit) {
      const startIndex = (data.page - 1) * data.limit;
      const endIndex = startIndex + data.limit;
      return filtered.slice(startIndex, endIndex);
    }

    return filtered;
  }

  /**
   * Activar/desactivar un cliente
   */
  async toggleClientStatus(data: ToggleClientStatusDto): Promise<Client> {
    if (!data.id_client || !data.status) {
      throw new Error("ID del cliente y estado son requeridos");
    }

    const client = await this.clientService.getClientById(
      data.id_client.toString()
    );

    if (!client) {
      throw new Error(`Cliente con ID ${data.id_client} no encontrado`);
    }

    // Actualizar estado
    return await this.clientService.updateClient(data.id_client.toString(), {
      status: data.status,
      status_reason: data.reason,
    } as any);
  }

  /**
   * Activar/desactivar un vendedor
   */
  async toggleSellerStatus(data: ToggleSellerStatusDto): Promise<Seller> {
    if (!data.id_seller || !data.status) {
      throw new Error("ID del vendedor y estado son requeridos");
    }

    const seller = await this.sellerService.getSellerById(
      data.id_seller.toString()
    );

    if (!seller) {
      throw new Error(`Vendedor con ID ${data.id_seller} no encontrado`);
    }

    // Actualizar estado
    return await this.sellerService.updateSeller(data.id_seller.toString(), {
      status: data.status,
      status_reason: data.reason,
    } as any);
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getSystemStats(data: GetSystemStatsDto): Promise<SystemStatsResponseDto> {
    const clients = await this.clientService.getAllClients();
    const sellers = await this.sellerService.getAllSellers();

    // Calcular estadísticas
    const stats: SystemStatsResponseDto = {
      totalClients: clients.length,
      totalSellers: sellers.length,
      totalProducts: 0, // Implementar con ProductService
      totalOrders: 0, // Implementar con OrderService
      totalRevenue: 0, // Implementar con OrderService
      activeClients: clients.filter((c: any) => c.status === "active").length,
      activeSellers: sellers.filter((s: any) => s.status === "active").length,
      pendingOrders: 0, // Implementar con OrderService
    };

    return stats;
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(data: GetUserByIdDto): Promise<Client | Seller | null> {
    if (!data.userId || !data.userType) {
      throw new Error("ID del usuario y tipo son requeridos");
    }

    if (data.userType === "client") {
      return await this.clientService.getClientById(data.userId.toString());
    } else if (data.userType === "seller") {
      return await this.sellerService.getSellerById(data.userId.toString());
    }

    throw new Error("Tipo de usuario inválido");
  }
}
