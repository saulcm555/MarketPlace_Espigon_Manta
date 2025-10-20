import { Request, Response } from "express";
import { AdminEntity } from "../../../models/adminModel";
import AppDataSource from "../../database/data-source";

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(AdminEntity);
    const admins = await repo.find();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener administradores", error });
  }
};

export const getAdminById = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(AdminEntity);
    const id = Number(req.params.id);
    const admin = await repo.findOneBy({ id_admin: id });
    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener administrador", error });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(AdminEntity);
    const admin = repo.create(req.body);
    await repo.save(admin);
    res.status(201).json(admin);
  } catch (error) {
    res.status(500).json({ message: "Error al crear administrador", error });
  }
};

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(AdminEntity);
    const id = Number(req.params.id);
    const admin = await repo.findOneBy({ id_admin: id });
    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }
    repo.merge(admin, req.body);
    await repo.save(admin);
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar administrador", error });
  }
};

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(AdminEntity);
    const id = Number(req.params.id);
    const result = await repo.delete(id);
    if (result.affected && result.affected > 0) {
      res.json({ message: "Administrador eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Administrador no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar administrador", error });
  }
};
