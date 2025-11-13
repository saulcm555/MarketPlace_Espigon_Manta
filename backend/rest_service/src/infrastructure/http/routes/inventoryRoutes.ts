import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { ownershipMiddleware } from "../../middlewares/ownershipMiddleware";
import { getInventories, getInventoryById, createInventory, updateInventory, deleteInventory } from "../controllers/inventoryController";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["seller", "admin"]), getInventories); // Seller ve sus inventarios, admin ve todos
router.get("/:id", authMiddleware, roleMiddleware(["seller", "admin"]), ownershipMiddleware("inventory"), getInventoryById); // Seller dueño o admin
router.post("/", authMiddleware, roleMiddleware("seller"), createInventory); // Solo seller
router.put("/:id", authMiddleware, roleMiddleware(["seller", "admin"]), ownershipMiddleware("inventory"), updateInventory); // Seller dueño o admin
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteInventory); // Solo admin

export default router;
