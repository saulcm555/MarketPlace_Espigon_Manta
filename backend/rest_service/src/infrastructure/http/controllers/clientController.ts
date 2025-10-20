import { Request, Response } from "express";
import { RegisterClient } from "../../../application/use_cases/clients/RegisterClient";
import { LoginClient } from "../../../application/use_cases/clients/LoginClient";
import { UpdateClientProfile } from "../../../application/use_cases/clients/UpdateClientProfile";
import { ClientService } from "../../../domain/services/ClientService";
import { ClientRepositoryImpl } from "../../repositories/ClientRepositoryImpl";

// Instancias de dependencias
const clientRepository = new ClientRepositoryImpl();
const clientService = new ClientService(clientRepository);

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await clientService.getAllClients();
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener clientes", error: error.message });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const client = await clientService.getClientById(id.toString());
    
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(client);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener cliente", error: error.message });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const registerClientUseCase = new RegisterClient(clientService);
    const client = await registerClientUseCase.execute(req.body);
    res.status(201).json(client);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al crear cliente" });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const updateClientProfileUseCase = new UpdateClientProfile(clientService);
    const id = Number(req.params.id);
    
    const client = await updateClientProfileUseCase.execute({
      id_client: id,
      ...req.body,
    });
    
    res.json(client);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar cliente" });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const success = await clientService.deleteClient(id.toString());
    
    if (success) {
      res.json({ message: "Cliente eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Cliente no encontrado" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar cliente", error: error.message });
  }
};
