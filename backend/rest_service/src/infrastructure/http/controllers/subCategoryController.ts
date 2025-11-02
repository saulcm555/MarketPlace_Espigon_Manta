import { Request, Response } from "express";
import { CreateSubCategory } from "../../../application/use_cases/categories/CreateSubCategory";
import { ManageCategories } from "../../../application/use_cases/categories/ManageCategories";
import { CategoryService } from "../../../domain/services/CategoryService";
import { SubCategoryService } from "../../../domain/services/SubCategoryService";
import { CategoryRepositoryImpl } from "../../repositories/CategoryRepositoryImpl";
import { SubCategoryRepositoryImpl } from "../../repositories/SubCategoryRepositoryImpl";

// Instancias de dependencias
const categoryRepository = new CategoryRepositoryImpl();
const subCategoryRepository = new SubCategoryRepositoryImpl();
const categoryService = new CategoryService(categoryRepository);
const subCategoryService = new SubCategoryService(subCategoryRepository);

/**
 * @swagger
 * /api/subcategories:
 *   get:
 *     summary: Listar todas las subcategorías
 *     tags: [SubCategories]
 *     responses:
 *       200:
 *         description: Lista de subcategorías obtenida exitosamente
 */
export const getSubCategories = async (req: Request, res: Response) => {
  try {
    const subCategories = await subCategoryService.getAllSubCategories();
    res.json(subCategories);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener subcategorías", error: error.message });
  }
};

/**
 * @swagger
 * /api/subcategories/{id}:
 *   get:
 *     summary: Obtener subcategoría por ID
 *     tags: [SubCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subcategoría obtenida exitosamente
 */
export const getSubCategoryById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const subCategory = await subCategoryService.getSubCategoryById(id.toString());
    
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategoría no encontrada" });
    }
    res.json(subCategory);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener subcategoría", error: error.message });
  }
};

/**
 * @swagger
 * /api/subcategories:
 *   post:
 *     summary: Crear nueva subcategoría
 *     tags: [SubCategories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sub_category_name
 *               - id_category
 *             properties:
 *               sub_category_name:
 *                 type: string
 *                 example: Laptops
 *               id_category:
 *                 type: integer
 *                 example: 1
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subcategoría creada exitosamente
 */
export const createSubCategory = async (req: Request, res: Response) => {
  try {
    const createSubCategoryUseCase = new CreateSubCategory(subCategoryService);
    const subCategory = await createSubCategoryUseCase.execute(req.body);
    res.status(201).json(subCategory);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al crear subcategoría" });
  }
};

/**
 * @swagger
 * /api/subcategories/{id}:
 *   put:
 *     summary: Actualizar subcategoría
 *     tags: [SubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subcategoría actualizada exitosamente
 */
export const updateSubCategory = async (req: Request, res: Response) => {
  try {
    const manageCategoriesUseCase = new ManageCategories(categoryService, subCategoryService);
    const id = Number(req.params.id);
    
    const subCategory = await manageCategoriesUseCase.updateSubCategory({
      id_sub_category: id,
      ...req.body,
    });
    
    res.json(subCategory);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar subcategoría" });
  }
};

/**
 * @swagger
 * /api/subcategories/{id}:
 *   delete:
 *     summary: Eliminar subcategoría
 *     tags: [SubCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subcategoría eliminada correctamente
 */
export const deleteSubCategory = async (req: Request, res: Response) => {
  try {
    const manageCategoriesUseCase = new ManageCategories(categoryService, subCategoryService);
    const id = Number(req.params.id);
    
    const success = await manageCategoriesUseCase.deleteSubCategory({ id_sub_category: id });
    
    if (success) {
      res.json({ message: "Subcategoría eliminada correctamente" });
    } else {
      res.status(404).json({ message: "Subcategoría no encontrada" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar subcategoría", error: error.message });
  }
};
