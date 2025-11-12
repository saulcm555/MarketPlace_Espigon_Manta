import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { ownershipMiddleware } from "../../middlewares/ownershipMiddleware";
import { getSellers, getSellerById, createSeller, updateSeller, deleteSeller } from "../controllers/sellerController";

const router = Router();

router.get("/", getSellers); // Pública
router.get("/:id", getSellerById); // Pública
router.post("/", createSeller); // Público para registro
router.put("/:id", authMiddleware, roleMiddleware("seller"), ownershipMiddleware("seller"), updateSeller); // Solo el seller dueño o admin
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteSeller); // Solo admin

export default router;
