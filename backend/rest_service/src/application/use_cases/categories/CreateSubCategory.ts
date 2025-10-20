import { CreateSubCategoryDto } from "../../dtos/categories/CreateSubCategory.dto";
import { SubCategoryService } from "../../../domain/services/SubCategoryService";
import { SubCategory } from "../../../domain/entities/sub_category";

/**
 * Caso de uso para crear una nueva subcategoría
 */
export class CreateSubCategory {
  constructor(private subCategoryService: SubCategoryService) {}

  /**
   * Ejecuta la creación de una nueva subcategoría
   * @param data - Datos de la subcategoría a crear
   * @returns Promise con la subcategoría creada
   */
  async execute(data: CreateSubCategoryDto): Promise<SubCategory> {
    return new Promise((resolve, reject) => {
      // Validar datos requeridos
      if (!data.id_category || !data.sub_category_name || !data.description) {
        reject(new Error("Categoría, nombre y descripción son requeridos"));
        return;
      }

      // Validar longitud del nombre
      if (data.sub_category_name.length < 3) {
        reject(
          new Error("El nombre de la subcategoría debe tener al menos 3 caracteres")
        );
        return;
      }

      const subCategoryData: Partial<SubCategory> = {
        id_category: data.id_category,
        sub_category_name: data.sub_category_name,
        description: data.description,
      };

      this.subCategoryService.createSubCategory(
        subCategoryData as SubCategory,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error("Error al crear la subcategoría"));
          }
        }
      );
    });
  }
}
