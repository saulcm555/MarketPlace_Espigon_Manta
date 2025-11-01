import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { getClients, getClientById, createClient, updateClient, deleteClient } from "../controllers/clientController";

const router = Router();

router.get("/", authMiddleware, roleMiddleware("admin"), getClients); // Solo admin
router.get("/:id", authMiddleware, getClientById); // Cliente autenticado
router.post("/", createClient); // Público para registro
router.put("/:id", authMiddleware, roleMiddleware("client"), updateClient); // Solo el cliente
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteClient); // Solo admin

export default router;
