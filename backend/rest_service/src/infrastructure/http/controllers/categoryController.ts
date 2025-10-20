import { Request, Response } from "express";
import { CategoryEntity } from "../../../models/categoryModel";
import AppDataSource from "../../database/data-source";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CategoryEntity);
    const categories = await repo.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener categorías", error });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CategoryEntity);
    const id = Number(req.params.id);
    const category = await repo.findOneBy({ id_category: id });
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener categoría", error });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CategoryEntity);
    const category = repo.create(req.body);
    await repo.save(category);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error al crear categoría", error });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CategoryEntity);
    const id = Number(req.params.id);
    const category = await repo.findOneBy({ id_category: id });
    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }
    repo.merge(category, req.body);
    await repo.save(category);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar categoría", error });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CategoryEntity);
    const id = Number(req.params.id);
    const result = await repo.delete(id);
    if (result.affected && result.affected > 0) {
      res.json({ message: "Categoría eliminada correctamente" });
    } else {
      res.status(404).json({ message: "Categoría no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar categoría", error });
  }
};
