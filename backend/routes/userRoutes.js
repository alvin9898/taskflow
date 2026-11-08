
import { Router } from "express";
import {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  createUser,
  assignManager,
  getMyTeam,
} from "../controllers/userController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

// Admin-only user management
router.get("/", authorize("Admin", "Manager"), listUsers);
router.post("/", authorize("Admin"), createUser);
router.put("/:id/assign-manager", authorize("Admin"), assignManager);
router.put("/:id", authorize("Admin"), updateUser);
router.delete("/:id", authorize("Admin"), deleteUser);

// Manager-only endpoint: get the logged-in Manager's Team Members

router.get("/my-team-test", (req, res) => {
  res.json({
    message: "Correct userRoutes.js is running",
    role: req.user.role,
  });
});

router.get("/my-team", authorize("Manager"), getMyTeam);

// Get a specific user's profile
router.get("/:id", getUser);

export default router;
