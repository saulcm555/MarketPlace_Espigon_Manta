import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { getInventories, getInventoryById, createInventory, updateInventory, deleteInventory } from "../controllers/inventoryController";

const router = Router();

router.get("/", authMiddleware, getInventories); // Requiere autenticación
router.get("/:id", authMiddleware, getInventoryById); // Requiere autenticación
router.post("/", authMiddleware, roleMiddleware("seller"), createInventory); // Solo seller
router.put("/:id", authMiddleware, roleMiddleware("seller"), updateInventory); // Solo seller
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteInventory); // Solo admin

export default router;
