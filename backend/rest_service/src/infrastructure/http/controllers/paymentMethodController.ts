import { Request, Response } from "express";
import AppDataSource from "../../database/data-source";
import { PaymentMethodEntity } from "../../../models/paymentMethodModel";
import { asyncHandler, NotFoundError } from "../../middlewares/errors";

export const getPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
  const paymentMethodRepo = AppDataSource.getRepository(PaymentMethodEntity);
  const paymentMethods = await paymentMethodRepo.find();
  res.json(paymentMethods);
});

export const getPaymentMethodById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const paymentMethodRepo = AppDataSource.getRepository(PaymentMethodEntity);
  const paymentMethod = await paymentMethodRepo.findOne({
    where: { id_payment_method: id }
  });

  if (!paymentMethod) {
    throw new NotFoundError("Método de pago");
  }

  res.json(paymentMethod);
});

export const createPaymentMethod = asyncHandler(async (req: Request, res: Response) => {
  const paymentMethodRepo = AppDataSource.getRepository(PaymentMethodEntity);
  const newPaymentMethod = paymentMethodRepo.create(req.body);
  const saved = await paymentMethodRepo.save(newPaymentMethod);
  res.status(201).json(saved);
});

export const updatePaymentMethod = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const paymentMethodRepo = AppDataSource.getRepository(PaymentMethodEntity);
  
  await paymentMethodRepo.update(id, req.body);
  const updated = await paymentMethodRepo.findOne({
    where: { id_payment_method: id }
  });

  if (!updated) {
    throw new NotFoundError("Método de pago");
  }

  res.json(updated);
});

/**
 * Eliminar un método de pago
 * DELETE /api/payment-methods/:id
 */
export const deletePaymentMethod = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const paymentMethodRepo = AppDataSource.getRepository(PaymentMethodEntity);
  
  const result = await paymentMethodRepo.delete(id);

  if (!result.affected || result.affected === 0) {
    throw new NotFoundError("Método de pago");
  }

  res.json({ message: "Método de pago eliminado correctamente" });
});
