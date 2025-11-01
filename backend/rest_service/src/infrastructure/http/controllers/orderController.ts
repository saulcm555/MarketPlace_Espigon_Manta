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

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Listar todas las órdenes
 *     description: Obtiene lista completa de órdenes (requiere permisos de administrador)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de órdenes obtenida exitosamente
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
 */
export const getOrders = async (req: Request, res: Response) => {
  try {
    // Para listar todas las órdenes (ADMIN), usamos directamente el servicio
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener órdenes", error: error.message });
  }
};

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obtener orden por ID
 *     description: Obtiene los detalles de una orden específica
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Orden obtenida exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Orden no encontrada
 *       500:
 *         description: Error interno del servidor
 */
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

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear nueva orden (TRANSACCIONAL - ProductOrder)
 *     description: Crea una orden con productos desde el carrito, utiliza tabla transaccional ProductOrder con transacción de base de datos
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_client
 *               - id_cart
 *               - id_payment_method
 *               - id_delivery
 *             properties:
 *               id_client:
 *                 type: integer
 *                 example: 1
 *               id_cart:
 *                 type: integer
 *                 example: 1
 *                 description: Carrito del cual se crearán los ProductOrder
 *               id_payment_method:
 *                 type: integer
 *                 example: 1
 *               id_delivery:
 *                 type: integer
 *                 example: 1
 *               order_notes:
 *                 type: string
 *                 example: Entregar en horario de oficina
 *     responses:
 *       201:
 *         description: Orden creada exitosamente con transacción completa
 *       400:
 *         description: Datos inválidos o carrito vacío
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor (transacción revertida)
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const createOrderUseCase = new CreateOrder(orderService, cartService);
    const order = await createOrderUseCase.execute(req.body);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al crear orden" });
  }
};

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Actualizar estado de orden
 *     description: Actualiza el estado de una orden existente
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 example: processing
 *     responses:
 *       200:
 *         description: Estado de orden actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Orden no encontrada
 *       500:
 *         description: Error interno del servidor
 */
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

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Eliminar orden
 *     description: Elimina una orden del sistema por su ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Orden eliminada correctamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Orden no encontrada
 *       500:
 *         description: Error interno del servidor
 */
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
