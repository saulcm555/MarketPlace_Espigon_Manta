import { Router } from "express";
import {
  loginClient,
  loginSeller,
  loginAdmin,
  verifyToken,
  registerClient,
  registerSeller,
} from "../controllers/authController";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  loginValidation,
  registerClientValidation,
  registerSellerValidation
} from "../../middlewares/validations/authValidations";

const router = Router();

// Login endpoints
router.post("/login/client", loginValidation, validateRequest, loginClient);
router.post("/login/seller", loginValidation, validateRequest, loginSeller);
router.post("/login/admin", loginValidation, validateRequest, loginAdmin);

// Register endpoints
router.post("/register/client", registerClientValidation, validateRequest, registerClient);
router.post("/register/seller", registerSellerValidation, validateRequest, registerSeller);

// Verify token
router.get("/verify", authMiddleware, verifyToken);

export default router;
