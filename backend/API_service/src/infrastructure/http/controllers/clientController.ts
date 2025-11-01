import { Request, Response } from "express";
import { ClientEntity } from "../../../models/clientModel";
import AppDataSource from "../../database/data-source";

export const getClients = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ClientEntity);
    const clients = await repo.find();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener clientes", error });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ClientEntity);
    const id = Number(req.params.id);
    const client = await repo.findOneBy({ id_client: id });
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener cliente", error });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ClientEntity);
    const client = repo.create(req.body);
    await repo.save(client);
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: "Error al crear cliente", error });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ClientEntity);
    const id = Number(req.params.id);
    const client = await repo.findOneBy({ id_client: id });
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    repo.merge(client, req.body);
    await repo.save(client);
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar cliente", error });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ClientEntity);
    const id = Number(req.params.id);
    const result = await repo.delete(id);
    if (result.affected && result.affected > 0) {
      res.json({ message: "Cliente eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Cliente no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar cliente", error });
  }
};
