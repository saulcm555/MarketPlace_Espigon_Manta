import { Request, Response } from "express";
import { RegisterSeller } from "../../../application/use_cases/sellers/RegisterSeller";
import { ManageSeller } from "../../../application/use_cases/sellers/ManageSeller";
import { SellerService } from "../../../domain/services/SellerService";
import { SellerRepositoryImpl } from "../../repositories/SellerRepositoryImpl";

// Instancias de dependencias
const sellerRepository = new SellerRepositoryImpl();
const sellerService = new SellerService(sellerRepository);

export const getSellers = async (req: Request, res: Response) => {
  try {
    const sellers = await sellerService.getAllSellers();
    res.json(sellers);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener sellers", error: error.message });
  }
};

export const getSellerById = async (req: Request, res: Response) => {
  try {
    const manageSellerUseCase = new ManageSeller(sellerService);
    const id = Number(req.params.id);
    
    const seller = await manageSellerUseCase.getSellerProfile(id);
    
    if (!seller) {
      return res.status(404).json({ message: "Seller no encontrado" });
    }
    res.json(seller);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener seller", error: error.message });
  }
};

export const createSeller = async (req: Request, res: Response) => {
  try {
    const registerSellerUseCase = new RegisterSeller(sellerService);
    const seller = await registerSellerUseCase.execute(req.body);
    res.status(201).json(seller);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al crear seller" });
  }
};

export const updateSeller = async (req: Request, res: Response) => {
  try {
    const manageSellerUseCase = new ManageSeller(sellerService);
    const id = Number(req.params.id);
    
    const seller = await manageSellerUseCase.updateSellerProfile({
      id_seller: id,
      ...req.body,
    });
    
    res.json(seller);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar seller" });
  }
};

export const deleteSeller = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const success = await sellerService.deleteSeller(id.toString());
    
    if (success) {
      res.json({ message: "Seller eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Seller no encontrado" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar seller", error: error.message });
  }
};
