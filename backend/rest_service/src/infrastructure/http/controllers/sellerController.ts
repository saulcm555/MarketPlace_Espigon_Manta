import { Request, Response } from "express";
import { RegisterSeller } from "../../../application/use_cases/sellers/RegisterSeller";
import { ManageSeller } from "../../../application/use_cases/sellers/ManageSeller";
import { SellerService } from "../../../domain/services/SellerService";
import { SellerRepositoryImpl } from "../../repositories/SellerRepositoryImpl";
import { asyncHandler, NotFoundError } from "../../middlewares/errors";

// Instancias de dependencias
const sellerRepository = new SellerRepositoryImpl();
const sellerService = new SellerService(sellerRepository);

export const getSellers = asyncHandler(async (req: Request, res: Response) => {
  const sellers = await sellerService.getAllSellers();
  res.json(sellers);
});

export const getSellerById = asyncHandler(async (req: Request, res: Response) => {
  const manageSellerUseCase = new ManageSeller(sellerService);
  const id = Number(req.params.id);
  
  const seller = await manageSellerUseCase.getSellerProfile(id);
  
  if (!seller) {
    throw new NotFoundError("Seller");
  }
  res.json(seller);
});

export const createSeller = asyncHandler(async (req: Request, res: Response) => {
  const registerSellerUseCase = new RegisterSeller(sellerService);
  const seller = await registerSellerUseCase.execute(req.body);
  res.status(201).json(seller);
});

export const updateSeller = asyncHandler(async (req: Request, res: Response) => {
  const manageSellerUseCase = new ManageSeller(sellerService);
  const id = Number(req.params.id);
  
  const seller = await manageSellerUseCase.updateSellerProfile({
    id_seller: id,
    ...req.body,
  });
  
  res.json(seller);
});

export const deleteSeller = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const success = await sellerService.deleteSeller(id.toString());
  
  if (!success) {
    throw new NotFoundError("Seller");
  }
  
  res.json({ message: "Seller eliminado correctamente" });
});

export const getSellerByUserId = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  
  const seller = await sellerService.getSellerByUserId(userId);
  
  if (!seller) {
    throw new NotFoundError("Seller");
  }
  
  res.json(seller);
});
