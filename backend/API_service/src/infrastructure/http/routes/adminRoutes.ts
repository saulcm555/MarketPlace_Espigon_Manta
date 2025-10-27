import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { getAdmins, getAdminById, createAdmin, updateAdmin, deleteAdmin } from "../controllers/adminController";

const router = Router();

router.get("/", authMiddleware, roleMiddleware("admin"), getAdmins); // Solo admin
router.get("/:id", authMiddleware, roleMiddleware("admin"), getAdminById); // Solo admin
router.post("/", authMiddleware, roleMiddleware("admin"), createAdmin); // Solo admin
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateAdmin); // Solo admin
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteAdmin); // Solo admin

export default router;
