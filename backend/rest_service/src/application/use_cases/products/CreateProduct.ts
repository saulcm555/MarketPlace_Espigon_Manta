import { CreateProductDto } from "../../dtos/products/CreateProduct.dto";
import { ProductService } from "../../../domain/services/ProductService";
import { InventoryService } from "../../../domain/services/InventoryService";
import { Product } from "../../../domain/entities/product";

/**
 * Caso de uso para crear un nuevo producto
 */
export class CreateProduct {
  constructor(
    private productService: ProductService,
    private inventoryService: InventoryService
  ) {}

  /**
   * Ejecuta la creación de un nuevo producto
   * @param data - Datos del producto a crear
   * @returns Promise con el producto creado
   */
  async execute(data: CreateProductDto): Promise<Product> {
    return new Promise(async (resolve, reject) => {
      try {
        // Validar datos requeridos
        if (!data.id_seller || !data.product_name || !data.id_category || !data.id_sub_category) {
          reject(
            new Error("Vendedor, nombre, categoría y subcategoría son requeridos")
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

        // Obtener o crear inventario del vendedor
        let inventory = await this.inventoryService.getInventoryBySeller(data.id_seller);
        
        if (!inventory) {
          // Crear inventario si no existe
          inventory = await new Promise<any>((resolveInv, rejectInv) => {
            this.inventoryService.createInventory(
              { id_seller: data.id_seller } as any,
              (error, result) => {
                if (error) rejectInv(error);
                else if (result) resolveInv(result);
                else rejectInv(new Error("Error al crear inventario"));
              }
            );
          });
        }

        if (!inventory || !inventory.id_inventory) {
          reject(new Error("No se pudo obtener o crear el inventario del vendedor"));
          return;
        }

        const productData: Partial<Product> = {
          id_seller: data.id_seller,
          id_category: data.id_category,
          id_sub_category: data.id_sub_category,
          id_inventory: inventory.id_inventory,
          product_name: data.product_name,
          description: data.description || data.product_description || "",
          image_url: data.image_url || data.product_image || "",
          price: data.price || data.product_price || 0,
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
      } catch (error) {
        reject(error);
      }
    });
  }
}
