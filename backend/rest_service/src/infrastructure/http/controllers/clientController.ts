import { Request, Response } from "express";
import { RegisterClient } from "../../../application/use_cases/clients/RegisterClient";
import { LoginClient } from "../../../application/use_cases/clients/LoginClient";
import { UpdateClientProfile } from "../../../application/use_cases/clients/UpdateClientProfile";
import { ClientService } from "../../../domain/services/ClientService";
import { ClientRepositoryImpl } from "../../repositories/ClientRepositoryImpl";
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from "../../middlewares/errors";

// Instancias de dependencias
const clientRepository = new ClientRepositoryImpl();
const clientService = new ClientService(clientRepository);

export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const clients = await clientService.getAllClients();
  res.json(clients);
});

export const getMyClient = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const userEmail = (req as any).user?.email;
  
  if (!userId) {
    throw new BadRequestError("No se pudo obtener el ID del usuario");
  }
  
  // Usar el nuevo método que busca por user_id o email y vincula automáticamente
  const client = await clientService.findOrLinkClientByUserIdAndEmail(userId, userEmail);
  
  if (!client) {
    throw new NotFoundError("Cliente");
  }
  res.json(client);
});

export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const client = await clientService.getClientById(id.toString());
  
  if (!client) {
    throw new NotFoundError("Cliente");
  }
  res.json(client);
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const registerClientUseCase = new RegisterClient(clientService);
  const client = await registerClientUseCase.execute(req.body);
  res.status(201).json(client);
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const updateClientProfileUseCase = new UpdateClientProfile(clientService);
  const id = Number(req.params.id);
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;
  
  // Validar que el usuario solo pueda actualizar su propio perfil (excepto admin)
  if (userRole !== 'admin' && userId !== id) {
    throw new ForbiddenError("Solo puedes actualizar tu propio perfil");
  }
  
  const client = await updateClientProfileUseCase.execute({
    id_client: id,
    ...req.body,
  });
  
  res.json(client);
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const success = await clientService.deleteClient(id.toString());
  
  if (!success) {
    throw new NotFoundError("Cliente");
  }
  
  res.json({ message: "Cliente eliminado correctamente" });
});
