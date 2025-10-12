import { CreateProductDto } from "../../dtos/products/CreateProduct.dto";
import { ProductService } from "../../../domain/services/ProductService";
import { Product } from "../../../domain/entities/product";

/**
 * Caso de uso para crear un nuevo producto
 */
export class CreateProduct {
  constructor(private productService: ProductService) {}

  /**
   * Ejecuta la creación de un nuevo producto
   * @param data - Datos del producto a crear
   * @returns Promise con el producto creado
   */
  async execute(data: CreateProductDto): Promise<Product> {
    return new Promise((resolve, reject) => {
      // Validar datos requeridos
      if (
        !data.id_seller ||
        !data.id_sub_category ||
        !data.product_name ||
        !data.description
      ) {
        reject(
          new Error(
            "Vendedor, subcategoría, nombre y descripción son requeridos"
          )
        );
        return;
      }

      // Validar precio
      if (data.price !== undefined && data.price < 0) {
        reject(new Error("El precio no puede ser negativo"));
        return;
      }

      // Validar longitud del nombre
      if (data.product_name.length < 3) {
        reject(
          new Error("El nombre del producto debe tener al menos 3 caracteres")
        );
        return;
      }

      const productData: Partial<Product> = {
        id_seller: data.id_seller,
        id_category: data.id_category,
        id_sub_category: data.id_sub_category,
        product_name: data.product_name,
        description: data.description,
        image_url: data.image_url || "",
        price: data.price || 0,
        stock: data.stock || 0,
      };

      this.productService.createProduct(
        productData as Product,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error("Error al crear el producto"));
          }
        }
      );
    });
  }
}
