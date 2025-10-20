import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { getSubCategories, getSubCategoryById, createSubCategory, updateSubCategory, deleteSubCategory } from "../controllers/subCategoryController";

const router = Router();

router.get("/", getSubCategories); // Pública
router.get("/:id", getSubCategoryById); // Pública
router.post("/", authMiddleware, roleMiddleware("admin"), createSubCategory); // Solo admin
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateSubCategory); // Solo admin
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteSubCategory); // Solo admin

export default router;
