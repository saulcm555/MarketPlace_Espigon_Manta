import { Request, Response } from "express";
import { LoginAdmin } from "../../../application/use_cases/admins/LoginAdmin";
import { ManageUsers } from "../../../application/use_cases/admins/ManageUsers";
import { AdminService } from "../../../domain/services/AdminService";
import { ClientService } from "../../../domain/services/ClientService";
import { SellerService } from "../../../domain/services/SellerService";
import { AdminRepositoryImpl } from "../../repositories/AdminRepositoryImpl";
import { ClientRepositoryImpl } from "../../repositories/ClientRepositoryImpl";
import { SellerRepositoryImpl } from "../../repositories/SellerRepositoryImpl";
import { asyncHandler, NotFoundError } from "../../middlewares/errors";

// Instancias de dependencias
const adminRepository = new AdminRepositoryImpl();
const clientRepository = new ClientRepositoryImpl();
const sellerRepository = new SellerRepositoryImpl();
const adminService = new AdminService(adminRepository);
const clientService = new ClientService(clientRepository);
const sellerService = new SellerService(sellerRepository);

export const getAdmins = asyncHandler(async (req: Request, res: Response) => {
  const admins = await adminService.getAllAdmins();
  res.json(admins);
});

export const getAdminById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const admin = await adminService.getAdminById(id.toString());
  
  if (!admin) {
    throw new NotFoundError("Administrador");
  }
  res.json(admin);
});

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  return new Promise<void>((resolve, reject) => {
    adminService.createAdmin(req.body, (err, admin) => {
      if (err) {
        reject(err);
      } else {
        res.status(201).json(admin);
        resolve();
      }
    });
  });
});

export const updateAdmin = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const admin = await adminService.updateAdmin(id.toString(), req.body);
  res.json(admin);
});

export const deleteAdmin = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const success = await adminService.deleteAdmin(id.toString());
  
  if (!success) {
    throw new NotFoundError("Administrador");
  }
  
  res.json({ message: "Administrador eliminado correctamente" });
});
