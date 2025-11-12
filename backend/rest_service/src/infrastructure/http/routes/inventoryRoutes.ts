import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { ownershipMiddleware } from "../../middlewares/ownershipMiddleware";
import { getInventories, getInventoryById, createInventory, updateInventory, deleteInventory } from "../controllers/inventoryController";

const router = Router();

router.get("/", authMiddleware, roleMiddleware("seller"), getInventories); // Solo seller ve sus inventarios
router.get("/:id", authMiddleware, roleMiddleware("seller"), ownershipMiddleware("inventory"), getInventoryById); // Solo el seller dueño o admin
router.post("/", authMiddleware, roleMiddleware("seller"), createInventory); // Solo seller
router.put("/:id", authMiddleware, roleMiddleware("seller"), ownershipMiddleware("inventory"), updateInventory); // Solo el seller dueño o admin
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteInventory); // Solo admin

export default router;
