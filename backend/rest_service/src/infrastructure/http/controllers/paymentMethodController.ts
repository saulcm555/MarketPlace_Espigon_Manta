import { Request, Response } from "express";
import AppDataSource from "../../database/data-source";
import { PaymentMethodEntity } from "../../../models/paymentMethodModel";

/**
 * @swagger
 * /api/payment-methods:
 *   get:
 *     summary: Listar todos los métodos de pago
 *     tags: [Payment Methods]
 *     responses:
 *       200:
 *         description: Lista de métodos de pago obtenida exitosamente
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
 * @swagger
 * /api/payment-methods/{id}:
 *   get:
 *     summary: Obtener método de pago por ID
 *     tags: [Payment Methods]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Método de pago obtenido exitosamente
 *       404:
 *         description: Método de pago no encontrado
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
 * @swagger
 * /api/payment-methods:
 *   post:
 *     summary: Crear nuevo método de pago
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method_name
 *             properties:
 *               payment_method_name:
 *                 type: string
 *                 example: Tarjeta de Crédito
 *               description:
 *                 type: string
 *                 example: Pago con tarjeta de crédito Visa/Mastercard
 *     responses:
 *       201:
 *         description: Método de pago creado exitosamente
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
 * @swagger
 * /api/payment-methods/{id}:
 *   put:
 *     summary: Actualizar método de pago
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Método de pago actualizado exitosamente
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
