import { CreateCategoryDto } from "../../dtos/categories/CreateCategory.dto";
import { CategoryService } from "../../../domain/services/CategoryService";
import { Category } from "../../../domain/entities/category";

/**
 * Caso de uso para crear una nueva categoría
 */
export class CreateCategory {
  constructor(private categoryService: CategoryService) {}

  /**
   * Ejecuta la creación de una nueva categoría
   * @param data - Datos de la categoría a crear
   * @returns Promise con la categoría creada
   */
  async execute(data: CreateCategoryDto): Promise<Category> {
    return new Promise((resolve, reject) => {
      // Validar datos requeridos
      if (!data.category_name || !data.description) {
        reject(new Error("Nombre y descripción son requeridos"));
        return;
      }

      // Validar longitud del nombre
      if (data.category_name.length < 3) {
        reject(new Error("El nombre debe tener al menos 3 caracteres"));
        return;
      }

      const categoryData: Partial<Category> = {
        category_name: data.category_name,
        description: data.description,
        photo: data.photo || "",
      };

      this.categoryService.createCategory(
        categoryData as Category,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error("Error al crear la categoría"));
          }
        }
      );
    });
  }
}
