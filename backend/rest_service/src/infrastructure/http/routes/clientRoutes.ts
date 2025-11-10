import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { 
  createClientValidation,
  updateClientValidation,
  getClientByIdValidation
} from "../../middlewares/validations/clientValidations";
import { getClients, getClientById, createClient, updateClient, deleteClient } from "../controllers/clientController";

const router = Router();

router.get("/", authMiddleware, roleMiddleware("admin"), getClients); // Solo admin
router.get("/:id", getClientByIdValidation, validateRequest, authMiddleware, getClientById); // Cliente autenticado
router.post("/", createClientValidation, validateRequest, createClient); // Público para registro
router.put("/:id", getClientByIdValidation, updateClientValidation, validateRequest, authMiddleware, updateClient); // Cualquier usuario autenticado puede actualizar su perfil
router.delete("/:id", getClientByIdValidation, validateRequest, authMiddleware, roleMiddleware("admin"), deleteClient); // Solo admin

export default router;
