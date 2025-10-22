import { Request, Response } from "express";
import AppDataSource from "../../database/data-source";
import { PaymentMethodEntity } from "../../../models/paymentMethodModel";

/**
 * Obtener todos los métodos de pago
 * GET /api/payment-methods
 */
export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const paymentMethodRepo = AppDataSource.getRepository(PaymentMethodEntity);
    const paymentMethods = await paymentMethodRepo.find();
    res.json(paymentMethods);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener métodos de pago", error: error.message });
  }
};

/**
 * Obtener un método de pago por ID
 * GET /api/payment-methods/:id
 */
export const getPaymentMethodById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const paymentMethodRepo = AppDataSource.getRepository(PaymentMethodEntity);
    const paymentMethod = await paymentMethodRepo.findOne({
      where: { id_payment_method: id }
    });

    if (!paymentMethod) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    res.json(paymentMethod);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener método de pago", error: error.message });
  }
};

/**
 * Crear un nuevo método de pago
 * POST /api/payment-methods
 */
export const createPaymentMethod = async (req: Request, res: Response) => {
  try {
    const paymentMethodRepo = AppDataSource.getRepository(PaymentMethodEntity);
    const newPaymentMethod = paymentMethodRepo.create(req.body);
    const saved = await paymentMethodRepo.save(newPaymentMethod);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ message: "Error al crear método de pago", error: error.message });
  }
};

/**
 * Actualizar un método de pago
 * PUT /api/payment-methods/:id
 */
export const updatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const paymentMethodRepo = AppDataSource.getRepository(PaymentMethodEntity);
    
    await paymentMethodRepo.update(id, req.body);
    const updated = await paymentMethodRepo.findOne({
      where: { id_payment_method: id }
    });

    if (!updated) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Error al actualizar método de pago", error: error.message });
  }
};

/**
 * Eliminar un método de pago
 * DELETE /api/payment-methods/:id
 */
export const deletePaymentMethod = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const paymentMethodRepo = AppDataSource.getRepository(PaymentMethodEntity);
    
    const result = await paymentMethodRepo.delete(id);

    if (!result.affected || result.affected === 0) {
      return res.status(404).json({ message: "Método de pago no encontrado" });
    }

    res.json({ message: "Método de pago eliminado correctamente" });
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar método de pago", error: error.message });
  }
};
