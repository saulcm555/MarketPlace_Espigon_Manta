import { Request, Response } from "express";
import { CreateOrder } from "../../../application/use_cases/orders/CreateOrder";
import { UpdateOrderStatus } from "../../../application/use_cases/orders/UpdateOrderStatus";
import { QueryOrders } from "../../../application/use_cases/orders/QueryOrders";
import { OrderService } from "../../../domain/services/OrderService";
import { CartService } from "../../../domain/services/CartService";
import { OrderRepositoryImpl } from "../../repositories/OrderRepositoryImpl";
import { CartRepositoryImpl } from "../../repositories/CartRepositoryImpl";
import { asyncHandler, NotFoundError } from "../../middlewares/errors";

// Instancias de dependencias
const orderRepository = new OrderRepositoryImpl();
const cartRepository = new CartRepositoryImpl();
const orderService = new OrderService(orderRepository);
const cartService = new CartService(cartRepository);

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  // Para listar todas las órdenes (ADMIN), usamos directamente el servicio
  const orders = await orderService.getAllOrders();
  res.json(orders);
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const queryOrdersUseCase = new QueryOrders(orderService);
  const order = await queryOrdersUseCase.getOrderById({ id_order: Number(req.params.id) });
  
  if (!order) {
    throw new NotFoundError("Orden");
  }
  res.json(order);
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const createOrderUseCase = new CreateOrder(orderService, cartService);
  const order = await createOrderUseCase.execute(req.body);
  res.status(201).json(order);
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const updateOrderStatusUseCase = new UpdateOrderStatus(orderService);
  const id = Number(req.params.id);
  
  const order = await updateOrderStatusUseCase.execute({
    id_order: id,
    status: req.body.status,
  });
  
  res.json(order);
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const success = await orderService.deleteOrder(id.toString());
  
  if (!success) {
    throw new NotFoundError("Orden");
  }
  
  res.json({ message: "Orden eliminada correctamente" });
});

// Agregar/actualizar reseña en un producto de la orden
export const addReview = asyncHandler(async (req: Request, res: Response) => {
  const { id_product_order } = req.params;
  const { rating, review_comment } = req.body;
  
  const updated = await orderService.addReviewToProductOrder(
    Number(id_product_order),
    rating,
    review_comment
  );
  
  if (!updated) {
    throw new NotFoundError("Producto en orden");
  }
  
  res.json({ message: "Reseña agregada correctamente", data: updated });
});

// Obtener reseñas de un producto
export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { id_product } = req.params;
  
  const reviews = await orderService.getProductReviews(Number(id_product));
  
  res.json(reviews);
});
