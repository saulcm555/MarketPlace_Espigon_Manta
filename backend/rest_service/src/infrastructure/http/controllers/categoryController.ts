import { Request, Response } from "express";
import { CreateCategory } from "../../../application/use_cases/categories/CreateCategory";
import { ManageCategories } from "../../../application/use_cases/categories/ManageCategories";
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

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.getAllCategories();
  res.json(categories);
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const category = await categoryService.getCategoryById(id.toString());
  
  if (!category) {
    throw new NotFoundError("Categoría");
  }
  res.json(category);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const createCategoryUseCase = new CreateCategory(categoryService);
  const category = await createCategoryUseCase.execute(req.body);
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const manageCategoriesUseCase = new ManageCategories(categoryService, subCategoryService);
  const id = Number(req.params.id);
  
  const category = await manageCategoriesUseCase.updateCategory({
    id_category: id,
    ...req.body,
  });
  
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const manageCategoriesUseCase = new ManageCategories(categoryService, subCategoryService);
  const id = Number(req.params.id);
  
  const success = await manageCategoriesUseCase.deleteCategory({ id_category: id });
  
  if (!success) {
    throw new NotFoundError("Categoría");
  }
  
  res.json({ message: "Categoría eliminada correctamente" });
});
