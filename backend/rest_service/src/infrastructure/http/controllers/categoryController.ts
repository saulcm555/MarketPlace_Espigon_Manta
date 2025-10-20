import { Request, Response } from "express";
import { CreateCategory } from "../../../application/use_cases/categories/CreateCategory";
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

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener categorías", error: error.message });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const category = await categoryService.getCategoryById(id.toString());
    
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener categoría", error: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const createCategoryUseCase = new CreateCategory(categoryService);
    const category = await createCategoryUseCase.execute(req.body);
    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al crear categoría" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const manageCategoriesUseCase = new ManageCategories(categoryService, subCategoryService);
    const id = Number(req.params.id);
    
    const category = await manageCategoriesUseCase.updateCategory({
      id_category: id,
      ...req.body,
    });
    
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar categoría" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const manageCategoriesUseCase = new ManageCategories(categoryService, subCategoryService);
    const id = Number(req.params.id);
    
    const success = await manageCategoriesUseCase.deleteCategory({ id_category: id });
    
    if (success) {
      res.json({ message: "Categoría eliminada correctamente" });
    } else {
      res.status(404).json({ message: "Categoría no encontrada" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar categoría", error: error.message });
  }
};
