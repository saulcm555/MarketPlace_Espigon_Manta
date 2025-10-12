import {
  LoginSellerDto,
  UpdateSellerProfileDto,
} from "../../dtos/sellers/ManageSeller.dto";
import { SellerService } from "../../../domain/services/SellerService";
import { Seller } from "../../../domain/entities/seller";

/**
 * Casos de uso para gestionar vendedores
 */
export class ManageSeller {
  constructor(private sellerService: SellerService) {}

  /**
   * Login de vendedor
   */
  async loginSeller(data: LoginSellerDto): Promise<Seller> {
    if (!data.seller_email || !data.seller_password) {
      throw new Error("Email y contraseña son requeridos");
    }

    const allSellers = await this.sellerService.getAllSellers();
    const seller = allSellers.find(
      (s) =>
        s.seller_email === data.seller_email &&
        s.seller_password === data.seller_password // TODO: Comparar con hash
    );

    if (!seller) {
      throw new Error("Credenciales inválidas");
    }

    // No retornar la contraseña
    const { seller_password, ...sellerWithoutPassword } = seller;
    return sellerWithoutPassword as Seller;
  }

  /**
   * Actualizar perfil de vendedor
   */
  async updateSellerProfile(data: UpdateSellerProfileDto): Promise<Seller> {
    if (!data.id_seller) {
      throw new Error("ID de vendedor es requerido");
    }

    const seller = await this.sellerService.getSellerById(
      data.id_seller.toString()
    );

    if (!seller) {
      throw new Error(`Vendedor con ID ${data.id_seller} no encontrado`);
    }

    const updateData: Partial<Seller> = {};
    if (data.seller_name) updateData.seller_name = data.seller_name;
    if (data.seller_email) {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.seller_email)) {
        throw new Error("El email no es válido");
      }
      updateData.seller_email = data.seller_email;
    }
    if (data.seller_password) {
      if (data.seller_password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }
      updateData.seller_password = data.seller_password; // TODO: Encriptar
    }
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.bussines_name) updateData.bussines_name = data.bussines_name;
    if (data.location) updateData.location = data.location;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    const updatedSeller = await this.sellerService.updateSeller(
      data.id_seller.toString(),
      updateData
    );

    // No retornar la contraseña
    const { seller_password, ...sellerWithoutPassword } = updatedSeller;
    return sellerWithoutPassword as Seller;
  }

  /**
   * Obtener perfil de vendedor por ID
   */
  async getSellerProfile(id_seller: number): Promise<Seller | null> {
    if (!id_seller) {
      throw new Error("ID de vendedor es requerido");
    }

    const seller = await this.sellerService.getSellerById(
      id_seller.toString()
    );

    if (!seller) {
      return null;
    }

    // No retornar la contraseña
    const { seller_password, ...sellerWithoutPassword } = seller;
    return sellerWithoutPassword as Seller;
  }
}


