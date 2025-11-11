import { Request, Response } from "express";
import { CreateSubCategory } from "../../../application/use_cases/categories/CreateSubCategory";
import { ManageCategories } from "../../../application/use_cases/categories/ManageCategories";
import { QueryCategories } from "../../../application/use_cases/categories/QueryCategories";
import { CategoryService } from "../../../domain/services/CategoryService";
import { SubCategoryService } from "../../../domain/services/SubCategoryService";
import { CategoryRepositoryImpl } from "../../repositories/CategoryRepositoryImpl";
import { SubCategoryRepositoryImpl } from "../../repositories/SubCategoryRepositoryImpl";
import { asyncHandler, NotFoundError } from "../../middlewares/errors";

// Instancias de dependencias
const categoryRepository = new CategoryRepositoryImpl();
const subCategoryRepository = new SubCategoryRepositoryImpl();
const categoryService = new CategoryService(categoryRepository);
const subCategoryService = new SubCategoryService(subCategoryRepository);

export const getSubCategories = asyncHandler(async (req: Request, res: Response) => {
  const { id_category } = req.query;
  
  // Si se proporciona id_category, filtrar por categoría
  if (id_category) {
    const queryCategoriesUseCase = new QueryCategories(categoryService, subCategoryService);
    const subCategories = await queryCategoriesUseCase.getSubCategories({
      id_category: Number(id_category)
    });
    return res.json(subCategories);
  }
  
  // Si no, devolver todas las subcategorías
  const subCategories = await subCategoryService.getAllSubCategories();
  res.json(subCategories);
});

export const getSubCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const subCategory = await subCategoryService.getSubCategoryById(id.toString());
  
  if (!subCategory) {
    throw new NotFoundError("Subcategoría");
  }
  res.json(subCategory);
});

export const createSubCategory = asyncHandler(async (req: Request, res: Response) => {
  const createSubCategoryUseCase = new CreateSubCategory(subCategoryService);
  const subCategory = await createSubCategoryUseCase.execute(req.body);
  res.status(201).json(subCategory);
});

export const updateSubCategory = asyncHandler(async (req: Request, res: Response) => {
  const manageCategoriesUseCase = new ManageCategories(categoryService, subCategoryService);
  const id = Number(req.params.id);
  
  const subCategory = await manageCategoriesUseCase.updateSubCategory({
    id_sub_category: id,
    ...req.body,
  });
  
  res.json(subCategory);
});

export const deleteSubCategory = asyncHandler(async (req: Request, res: Response) => {
  const manageCategoriesUseCase = new ManageCategories(categoryService, subCategoryService);
  const id = Number(req.params.id);
  
  const success = await manageCategoriesUseCase.deleteSubCategory({ id_sub_category: id });
  
  if (!success) {
    throw new NotFoundError("Subcategoría");
  }
  
  res.json({ message: "Subcategoría eliminada correctamente" });
});
