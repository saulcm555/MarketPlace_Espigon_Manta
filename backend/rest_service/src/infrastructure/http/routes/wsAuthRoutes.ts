import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import AppDataSource from "../../database/data-source";
import { OrderEntity } from "../../../models/orderModel";
import { SellerEntity } from "../../../models/sellerModel";
import { asyncHandler } from "../../middlewares/errors";

const router = Router();

/**
 * Verifica si un usuario puede acceder a una orden específica (sala WebSocket)
 * GET /api/ws/orders/:id/can_access?user_id=123
 */
router.get(
  "/orders/:id/can_access",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id || !id) {
      return res.json({ allowed: false });
    }

    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const order = await orderRepo.findOne({
      where: { id_order: parseInt(id, 10) },
      relations: ["productOrders", "productOrders.product"],
    });

    if (!order) {
      return res.json({ allowed: false });
    }

    // Verificar si el usuario es el cliente de la orden
    if (order.id_client?.toString() === user_id) {
      return res.json({ allowed: true });
    }

    // Verificar si el usuario es el vendedor de algún producto de la orden
    const isSellerOfOrder = order.productOrders?.some(
      (po) => po.product?.id_seller?.toString() === user_id
    );

    if (isSellerOfOrder) {
      return res.json({ allowed: true });
    }

    // No tiene acceso
    return res.json({ allowed: false });
  })
);

/**
 * Verifica si un usuario puede acceder a la sala de un vendedor
 * GET /api/ws/sellers/:id/can_access?user_id=123
 */
router.get(
  "/sellers/:id/can_access",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id || !id) {
      return res.json({ allowed: false });
    }

    const sellerRepo = AppDataSource.getRepository(SellerEntity);
    const seller = await sellerRepo.findOne({
      where: { id_seller: parseInt(id, 10) },
    });

    if (!seller) {
      return res.json({ allowed: false });
    }

    // Verificar si el usuario es el vendedor
    if (seller.id_seller?.toString() === user_id) {
      return res.json({ allowed: true });
    }

    // No tiene acceso
    return res.json({ allowed: false });
  })
);

/**
 * Verifica si un usuario puede acceder a la sala de un cliente
 * GET /api/ws/clients/:id/can_access?user_id=123
 */
router.get(
  "/clients/:id/can_access",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.json({ allowed: false });
    }

    // Verificar si el usuario es el mismo cliente
    if (id === user_id) {
      return res.json({ allowed: true });
    }

    // No tiene acceso
    return res.json({ allowed: false });
  })
);

/**
 * Endpoint genérico de validación para otras salas
 * GET /api/ws/can_join?room=sala-123&user_id=456
 */
router.get(
  "/can_join",
  asyncHandler(async (req: Request, res: Response) => {
    const { room, user_id } = req.query;

    if (!room || !user_id) {
      return res.json({ allowed: false });
    }

    const roomStr = room as string;
    const userIdStr = user_id as string;

    // Validación para salas de clientes (client-{id})
    if (roomStr.startsWith("client-")) {
      const clientId = roomStr.replace("client-", "");
      // El usuario puede acceder a su propia sala de cliente
      if (clientId === userIdStr) {
        return res.json({ allowed: true });
      }
      return res.json({ allowed: false });
    }

    // Validación para salas de órdenes (order-{id})
    if (roomStr.startsWith("order-")) {
      const orderId = roomStr.replace("order-", "");
      // Redirigir a la validación específica de órdenes
      // (En un caso real, duplicarías la lógica aquí o harías una llamada interna)
      return res.json({ allowed: false });
    }

    // Validación para salas de vendedores (seller-{id})
    if (roomStr.startsWith("seller-")) {
      const sellerId = roomStr.replace("seller-", "");
      // El usuario puede acceder si es el vendedor
      if (sellerId === userIdStr) {
        return res.json({ allowed: true });
      }
      return res.json({ allowed: false });
    }

    // Salas públicas (ejemplo: sala de administradores)
    if (roomStr === "admins") {
      // Solo administradores (esto requeriría validar el token)
      return res.json({ allowed: false });
    }

    // Por defecto, denegar acceso a salas desconocidas
    return res.json({ allowed: false });
  })
);

export default router;
