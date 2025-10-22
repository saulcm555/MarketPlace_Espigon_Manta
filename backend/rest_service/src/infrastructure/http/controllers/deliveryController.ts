import { Request, Response } from "express";
import AppDataSource from "../../database/data-source";
import { DeliveryEntity } from "../../../models/deliveryModel";

/**
 * Obtener todos los métodos de entrega
 * GET /api/deliveries
 */
export const getDeliveries = async (req: Request, res: Response) => {
  try {
    const deliveryRepo = AppDataSource.getRepository(DeliveryEntity);
    const deliveries = await deliveryRepo.find();
    res.json(deliveries);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener métodos de entrega", error: error.message });
  }
};

/**
 * Obtener un método de entrega por ID
 * GET /api/deliveries/:id
 */
export const getDeliveryById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deliveryRepo = AppDataSource.getRepository(DeliveryEntity);
    const delivery = await deliveryRepo.findOne({
      where: { id_delivery: id }
    });

    if (!delivery) {
      return res.status(404).json({ message: "Método de entrega no encontrado" });
    }

    res.json(delivery);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener método de entrega", error: error.message });
  }
};

/**
 * Crear un nuevo método de entrega
 * POST /api/deliveries
 */
export const createDelivery = async (req: Request, res: Response) => {
  try {
    const deliveryRepo = AppDataSource.getRepository(DeliveryEntity);
    const newDelivery = deliveryRepo.create(req.body);
    const saved = await deliveryRepo.save(newDelivery);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ message: "Error al crear método de entrega", error: error.message });
  }
};

/**
 * Actualizar un método de entrega
 * PUT /api/deliveries/:id
 */
export const updateDelivery = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deliveryRepo = AppDataSource.getRepository(DeliveryEntity);
    
    await deliveryRepo.update(id, req.body);
    const updated = await deliveryRepo.findOne({
      where: { id_delivery: id }
    });

    if (!updated) {
      return res.status(404).json({ message: "Método de entrega no encontrado" });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Error al actualizar método de entrega", error: error.message });
  }
};

/**
 * Eliminar un método de entrega
 * DELETE /api/deliveries/:id
 */
export const deleteDelivery = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deliveryRepo = AppDataSource.getRepository(DeliveryEntity);
    
    const result = await deliveryRepo.delete(id);

    if (!result.affected || result.affected === 0) {
      return res.status(404).json({ message: "Método de entrega no encontrado" });
    }

    res.json({ message: "Método de entrega eliminado correctamente" });
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar método de entrega", error: error.message });
  }
};
