import { Request, Response } from "express";
import { RegisterClient } from "../../../application/use_cases/clients/RegisterClient";
import { LoginClient } from "../../../application/use_cases/clients/LoginClient";
import { UpdateClientProfile } from "../../../application/use_cases/clients/UpdateClientProfile";
import { ClientService } from "../../../domain/services/ClientService";
import { ClientRepositoryImpl } from "../../repositories/ClientRepositoryImpl";
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from "../../middlewares/errors";
import AppDataSource from "../../database/data-source";
import { ClientEntity } from "../../../models/clientModel";

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

/**
 * POST /api/clients/find-or-create
 * Endpoint interno para crear clientes automáticamente desde Auth Service o cupones B2B
 * Si el cliente ya existe (por email o user_id), lo retorna. Si no, lo crea.
 */
export const findOrCreateClient = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, source, user_id } = req.body;
  
  if (!email) {
    throw new BadRequestError("El email es requerido");
  }
  
  console.log(`🔍 [findOrCreateClient] Buscando cliente: ${email}, user_id: ${user_id}`);
  
  // Buscar cliente existente por email o user_id
  let client = await clientService.getClientByEmail(email);
  
  // Si existe y viene user_id, actualizar el user_id si no lo tiene
  if (client) {
    if (user_id && !client.user_id) {
      console.log(`🔄 [findOrCreateClient] Actualizando user_id del cliente existente`);
      const clientRepo = AppDataSource.getRepository(ClientEntity);
      await clientRepo.update({ id_client: client.id_client }, { user_id: user_id });
      client.user_id = user_id;
    }
    console.log(`✅ [findOrCreateClient] Cliente encontrado: ${client.id_client}`);
    return res.json({ 
      client, 
      created: false,
      message: "Cliente ya existe"
    });
  }
  
  // Crear cliente nuevo usando promesa
  console.log(`📝 [findOrCreateClient] Creando cliente nuevo: ${email}`);
  
  const newClientData = {
    client_name: name || email.split('@')[0],
    client_email: email,                    // ← Campo correcto
    client_password: `temp_${Date.now()}`,  // ← Campo correcto (NO se usa, auth está en Auth Service)
    user_id: user_id || null,               // Vincular con auth_service.users
    address: 'Por definir',                 // Campo requerido
  };
  
  // Wrap callback en promesa
  const newClient = await new Promise<any>((resolve, reject) => {
    clientService.createClient(newClientData as any, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
  
  console.log(`✅ [findOrCreateClient] Cliente creado: ${newClient?.id_client}, user_id: ${user_id}`);
  
  res.status(201).json({ 
    client: newClient, 
    created: true,
    message: "Cliente creado automáticamente"
  });
});


