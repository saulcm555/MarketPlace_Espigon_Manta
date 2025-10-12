import { RegisterSellerDto } from "../../dtos/sellers/RegisterSeller.dto";
import { SellerService } from "../../../domain/services/SellerService";
import { Seller } from "../../../domain/entities/seller";

/**
 * Caso de uso para registrar un nuevo vendedor
 */
export class RegisterSeller {
  constructor(private sellerService: SellerService) {}

  /**
   * Ejecuta el registro de un nuevo vendedor
   * @param data - Datos del vendedor a registrar
   * @returns Promise con el vendedor creado
   */
  async execute(data: RegisterSellerDto): Promise<Seller> {
    return new Promise((resolve, reject) => {
      // Validar datos requeridos
      if (
        !data.seller_name ||
        !data.seller_email ||
        !data.seller_password ||
        !data.bussines_name
      ) {
        reject(
          new Error(
            "Nombre, email, contraseña y nombre del negocio son requeridos"
          )
        );
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.seller_email)) {
        reject(new Error("El email no es válido"));
        return;
      }

      // Validar longitud de contraseña
      if (data.seller_password.length < 6) {
        reject(
          new Error("La contraseña debe tener al menos 6 caracteres")
        );
        return;
      }

      // TODO: Verificar que el email no esté ya registrado

      const sellerData: Partial<Seller> = {
        seller_name: data.seller_name,
        seller_email: data.seller_email,
        seller_password: data.seller_password, // TODO: Encriptar password
        phone: data.phone || 0,
        bussines_name: data.bussines_name,
        location: data.location || "",
      };

      this.sellerService.createSeller(
        sellerData as Seller,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            // No retornar la contraseña
            const { seller_password, ...sellerWithoutPassword } = result;
            resolve(sellerWithoutPassword as Seller);
          } else {
            reject(new Error("Error al registrar el vendedor"));
          }
        }
      );
    });
  }
}
