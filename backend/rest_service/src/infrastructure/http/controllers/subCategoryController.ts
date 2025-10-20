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

export const getSubCategories = async (req: Request, res: Response) => {
  try {
    const subCategories = await subCategoryService.getAllSubCategories();
    res.json(subCategories);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener subcategorías", error: error.message });
  }
};

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

export const createSubCategory = async (req: Request, res: Response) => {
  try {
    const createSubCategoryUseCase = new CreateSubCategory(subCategoryService);
    const subCategory = await createSubCategoryUseCase.execute(req.body);
    res.status(201).json(subCategory);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al crear subcategoría" });
  }
};

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
