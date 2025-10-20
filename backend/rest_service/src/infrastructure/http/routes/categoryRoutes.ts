import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from "../controllers/categoryController";

const router = Router();

router.get("/", getCategories); // Pública
router.get("/:id", getCategoryById); // Pública
router.post("/", authMiddleware, roleMiddleware("admin"), createCategory); // Solo admin
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateCategory); // Solo admin
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteCategory); // Solo admin

export default router;
