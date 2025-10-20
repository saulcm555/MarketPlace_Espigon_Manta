import { Request, Response } from "express";
import { SubCategoryEntity, SubCategoryProductEntity } from "../../../models/subCategoryModel";
import AppDataSource from "../../database/data-source";

export const getSubCategories = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SubCategoryEntity);
    const subCategories = await repo.find({ 
      relations: ["category", "subCategoryProducts", "subCategoryProducts.product"] 
    });
    res.json(subCategories);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener subcategorías", error });
  }
};

export const getSubCategoryById = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SubCategoryEntity);
    const id = Number(req.params.id);
    const subCategory = await repo.findOne({ 
      where: { id_sub_category: id },
      relations: ["category", "subCategoryProducts", "subCategoryProducts.product"]
    });
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategoría no encontrada" });
    }
    res.json(subCategory);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener subcategoría", error });
  }
};

export const createSubCategory = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SubCategoryEntity);
    const subCategory = repo.create(req.body);
    await repo.save(subCategory);
    res.status(201).json(subCategory);
  } catch (error) {
    res.status(500).json({ message: "Error al crear subcategoría", error });
  }
};

export const updateSubCategory = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SubCategoryEntity);
    const id = Number(req.params.id);
    const subCategory = await repo.findOneBy({ id_sub_category: id });
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategoría no encontrada" });
    }
    repo.merge(subCategory, req.body);
    await repo.save(subCategory);
    res.json(subCategory);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar subcategoría", error });
  }
};

export const deleteSubCategory = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SubCategoryEntity);
    const id = Number(req.params.id);
    const result = await repo.delete(id);
    if (result.affected && result.affected > 0) {
      res.json({ message: "Subcategoría eliminada correctamente" });
    } else {
      res.status(404).json({ message: "Subcategoría no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar subcategoría", error });
  }
};
