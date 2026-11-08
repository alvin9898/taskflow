
import { Router } from "express";

import {
  register,
  login,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public login.
router.post("/login", login);

// Public registration is intentionally disabled.
// The controller also rejects requests to this endpoint.
router.post("/register", register);

// Authenticated account routes.
router.get("/me", protect, me);
router.put("/change-password", protect, changePassword);

// Password recovery.
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;

