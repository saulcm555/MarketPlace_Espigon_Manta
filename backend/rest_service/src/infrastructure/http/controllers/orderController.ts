import { Request, Response } from "express";
import { CreateOrder } from "../../../application/use_cases/orders/CreateOrder";
import { UpdateOrderStatus } from "../../../application/use_cases/orders/UpdateOrderStatus";
import { QueryOrders } from "../../../application/use_cases/orders/QueryOrders";
import { OrderService } from "../../../domain/services/OrderService";
import { CartService } from "../../../domain/services/CartService";
import { OrderRepositoryImpl } from "../../repositories/OrderRepositoryImpl";
import { CartRepositoryImpl } from "../../repositories/CartRepositoryImpl";

// Instancias de dependencias
const orderRepository = new OrderRepositoryImpl();
const cartRepository = new CartRepositoryImpl();
const orderService = new OrderService(orderRepository);
const cartService = new CartService(cartRepository);

export const getOrders = async (req: Request, res: Response) => {
  try {
    // Para listar todas las órdenes (ADMIN), usamos directamente el servicio
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener órdenes", error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const queryOrdersUseCase = new QueryOrders(orderService);
    const order = await queryOrdersUseCase.getOrderById({ id_order: Number(req.params.id) });
    
    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener orden", error: error.message });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const createOrderUseCase = new CreateOrder(orderService, cartService);
    const order = await createOrderUseCase.execute(req.body);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al crear orden" });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const updateOrderStatusUseCase = new UpdateOrderStatus(orderService);
    const id = Number(req.params.id);
    
    const order = await updateOrderStatusUseCase.execute({
      id_order: id,
      status: req.body.status,
    });
    
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar orden" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const success = await orderService.deleteOrder(id.toString());
    
    if (success) {
      res.json({ message: "Orden eliminada correctamente" });
    } else {
      res.status(404).json({ message: "Orden no encontrada" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar orden", error: error.message });
  }
};
