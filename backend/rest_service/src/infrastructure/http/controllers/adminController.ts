import { Request, Response } from "express";
import { LoginAdmin } from "../../../application/use_cases/admins/LoginAdmin";
import { ManageUsers } from "../../../application/use_cases/admins/ManageUsers";
import { AdminService } from "../../../domain/services/AdminService";
import { ClientService } from "../../../domain/services/ClientService";
import { SellerService } from "../../../domain/services/SellerService";
import { AdminRepositoryImpl } from "../../repositories/AdminRepositoryImpl";
import { ClientRepositoryImpl } from "../../repositories/ClientRepositoryImpl";
import { SellerRepositoryImpl } from "../../repositories/SellerRepositoryImpl";

// Instancias de dependencias
const adminRepository = new AdminRepositoryImpl();
const clientRepository = new ClientRepositoryImpl();
const sellerRepository = new SellerRepositoryImpl();
const adminService = new AdminService(adminRepository);
const clientService = new ClientService(clientRepository);
const sellerService = new SellerService(sellerRepository);

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await adminService.getAllAdmins();
    res.json(admins);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener administradores", error: error.message });
  }
};

export const getAdminById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const admin = await adminService.getAdminById(id.toString());
    
    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }
    res.json(admin);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener administrador", error: error.message });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    adminService.createAdmin(req.body, (err, admin) => {
      if (err) {
        return res.status(500).json({ message: "Error al crear administrador", error: err.message });
      }
      res.status(201).json(admin);
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error al crear administrador", error: error.message });
  }
};

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const admin = await adminService.updateAdmin(id.toString(), req.body);
    res.json(admin);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar administrador" });
  }
};

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const success = await adminService.deleteAdmin(id.toString());
    
    if (success) {
      res.json({ message: "Administrador eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Administrador no encontrado" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar administrador", error: error.message });
  }
};
