import { Request, Response } from "express";
import AppDataSource from "../../database/data-source";
import { DeliveryEntity } from "../../../models/deliveryModel";

/**
 * @swagger
 * /api/deliveries:
 *   get:
 *     summary: Listar todos los métodos de entrega
 *     tags: [Deliveries]
 *     responses:
 *       200:
 *         description: Lista de métodos de entrega obtenida exitosamente
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
 * @swagger
 * /api/deliveries/{id}:
 *   get:
 *     summary: Obtener método de entrega por ID
 *     tags: [Deliveries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Método de entrega obtenido exitosamente
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
 * @swagger
 * /api/deliveries:
 *   post:
 *     summary: Crear nuevo método de entrega
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - delivery_method_name
 *             properties:
 *               delivery_method_name:
 *                 type: string
 *                 example: Entrega a domicilio
 *               delivery_cost:
 *                 type: number
 *                 example: 3.50
 *               estimated_time:
 *                 type: string
 *                 example: 1-2 días hábiles
 *     responses:
 *       201:
 *         description: Método de entrega creado exitosamente
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
 * @swagger
 * /api/deliveries/{id}:
 *   put:
 *     summary: Actualizar método de entrega
 *     tags: [Deliveries]
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
 *         description: Método de entrega actualizado exitosamente
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
