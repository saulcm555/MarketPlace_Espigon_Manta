import { Request, Response } from "express";
import { OrderEntity, ProductOrderEntity } from "../../../models/orderModel";
import AppDataSource from "../../database/data-source";

export const getOrders = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(OrderEntity);
    const orders = await repo.find({ 
      relations: ["cart", "delivery", "productOrders", "productOrders.product"] 
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener órdenes", error });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(OrderEntity);
    const id = Number(req.params.id);
    const order = await repo.findOne({
      where: { id_order: id },
      relations: ["cart", "delivery", "productOrders", "productOrders.product"]
    });
    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener orden", error });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(OrderEntity);
    const order = repo.create(req.body);
    await repo.save(order);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error al crear orden", error });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(OrderEntity);
    const id = Number(req.params.id);
    const order = await repo.findOneBy({ id_order: id });
    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    repo.merge(order, req.body);
    await repo.save(order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar orden", error });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(OrderEntity);
    const id = Number(req.params.id);
    const result = await repo.delete(id);
    if (result.affected && result.affected > 0) {
      res.json({ message: "Orden eliminada correctamente" });
    } else {
      res.status(404).json({ message: "Orden no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar orden", error });
  }
};
