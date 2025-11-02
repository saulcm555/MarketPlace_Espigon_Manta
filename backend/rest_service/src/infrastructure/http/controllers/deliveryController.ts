import { Request, Response } from "express";
import AppDataSource from "../../database/data-source";
import { DeliveryEntity } from "../../../models/deliveryModel";
import { asyncHandler, NotFoundError } from "../../middlewares/errors";

export const getDeliveries = asyncHandler(async (req: Request, res: Response) => {
  const deliveryRepo = AppDataSource.getRepository(DeliveryEntity);
  const deliveries = await deliveryRepo.find();
  res.json(deliveries);
});

export const getDeliveryById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deliveryRepo = AppDataSource.getRepository(DeliveryEntity);
  const delivery = await deliveryRepo.findOne({
    where: { id_delivery: id }
  });

  if (!delivery) {
    throw new NotFoundError("Método de entrega");
  }

  res.json(delivery);
});

export const createDelivery = asyncHandler(async (req: Request, res: Response) => {
  const deliveryRepo = AppDataSource.getRepository(DeliveryEntity);
  const newDelivery = deliveryRepo.create(req.body);
  const saved = await deliveryRepo.save(newDelivery);
  res.status(201).json(saved);
});

export const updateDelivery = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deliveryRepo = AppDataSource.getRepository(DeliveryEntity);
  
  await deliveryRepo.update(id, req.body);
  const updated = await deliveryRepo.findOne({
    where: { id_delivery: id }
  });

  if (!updated) {
    throw new NotFoundError("Método de entrega");
  }

  res.json(updated);
});

/**
 * Eliminar un método de entrega
 * DELETE /api/deliveries/:id
 */
export const deleteDelivery = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deliveryRepo = AppDataSource.getRepository(DeliveryEntity);
  
  const result = await deliveryRepo.delete(id);

  if (!result.affected || result.affected === 0) {
    throw new NotFoundError("Método de entrega");
  }

  res.json({ message: "Método de entrega eliminado correctamente" });
});
