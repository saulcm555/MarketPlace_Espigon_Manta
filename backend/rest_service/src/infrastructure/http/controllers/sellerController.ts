import { Request, Response } from "express";
import { RegisterSeller } from "../../../application/use_cases/sellers/RegisterSeller";
import { ManageSeller } from "../../../application/use_cases/sellers/ManageSeller";
import { SellerService } from "../../../domain/services/SellerService";
import { SellerRepositoryImpl } from "../../repositories/SellerRepositoryImpl";
import { SellerEntity } from "../../../models/sellerModel";
import AppDataSource from "../../database/data-source";
import { asyncHandler, NotFoundError, BadRequestError } from "../../middlewares/errors";

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

/**
 * POST /api/sellers/find-or-create
 * Endpoint interno para crear sellers automáticamente desde Auth Service
 * Si el seller ya existe (por email o user_id), lo retorna. Si no, lo crea.
 */
export const findOrCreateSeller = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, user_id, phone, bussines_name, location } = req.body;
  
  if (!email) {
    throw new BadRequestError("El email es requerido");
  }
  
  console.log(`🔍 [findOrCreateSeller] Buscando seller: ${email}, user_id: ${user_id}`);
  
  const sellerRepo = AppDataSource.getRepository(SellerEntity);
  
  // Buscar seller existente por email o user_id
  let seller = await sellerRepo.findOneBy({ seller_email: email });
  
  // Si no se encuentra por email, buscar por user_id
  if (!seller && user_id) {
    seller = await sellerRepo.findOneBy({ user_id: user_id });
  }
  
  // Si existe y viene user_id, actualizar el user_id si no lo tiene
  if (seller) {
    if (user_id && !seller.user_id) {
      console.log(`🔄 [findOrCreateSeller] Actualizando user_id del seller existente`);
      await sellerRepo.update({ id_seller: seller.id_seller }, { user_id: user_id });
      seller.user_id = user_id;
    }
    console.log(`✅ [findOrCreateSeller] Seller encontrado: ${seller.id_seller}`);
    return res.json({ 
      seller, 
      created: false,
      message: "Seller ya existe"
    });
  }
  
  // Crear seller nuevo
  console.log(`📝 [findOrCreateSeller] Creando seller nuevo: ${email}`);
  
  const newSellerData = {
    seller_name: name || email.split('@')[0],
    seller_email: email,
    seller_password: `temp_${Date.now()}`, // NO se usa, auth está en Auth Service
    user_id: user_id || null,
    phone: phone || 0,
    bussines_name: bussines_name || 'Por definir',
    location: location || 'Por definir',
  };
  
  const newSeller = sellerRepo.create(newSellerData);
  const savedSeller = await sellerRepo.save(newSeller);
  
  console.log(`✅ [findOrCreateSeller] Seller creado: ${savedSeller.id_seller}`);
  
  res.status(201).json({
    seller: savedSeller,
    created: true,
    message: "Seller creado automáticamente"
  });
});
