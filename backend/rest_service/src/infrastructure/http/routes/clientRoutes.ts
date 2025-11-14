import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { ownershipMiddleware } from "../../middlewares/ownershipMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { 
  createClientValidation,
  updateClientValidation,
  getClientByIdValidation
} from "../../middlewares/validations/clientValidations";
import { getClients, getClientById, createClient, updateClient, deleteClient } from "../controllers/clientController";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["admin", "service"]), getClients); // Admin y servicio interno
router.get("/:id", getClientByIdValidation, validateRequest, authMiddleware, roleMiddleware(["client", "admin"]), ownershipMiddleware("client"), getClientById); // Cliente dueño o admin
router.post("/", createClientValidation, validateRequest, createClient); // Público para registro
router.put("/:id", getClientByIdValidation, updateClientValidation, validateRequest, authMiddleware, roleMiddleware(["client", "admin"]), ownershipMiddleware("client"), updateClient); // Cliente dueño o admin
router.delete("/:id", getClientByIdValidation, validateRequest, authMiddleware, roleMiddleware("admin"), deleteClient); // Solo admin

export default router;
