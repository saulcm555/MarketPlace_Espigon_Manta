import { Router } from "express";
import {
  loginClient,
  loginSeller,
  loginAdmin,
  verifyToken,
  registerClient,
} from "../controllers/authController";

const router = Router();

// Login endpoints
router.post("/login/client", loginClient);
router.post("/login/seller", loginSeller);
router.post("/login/admin", loginAdmin);

// Register endpoints
router.post("/register/client", registerClient);

// Verify token
router.get("/verify", verifyToken);

export default router;
