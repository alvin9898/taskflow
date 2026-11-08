import { Router } from "express";

import {
  listTasks,
  getMyTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = Router();

// Every task route requires authentication.
router.use(protect);

// List tasks according to the logged-in user's role.
router.get("/", listTasks);

// Get tasks assigned to the logged-in user.
router.get("/my", getMyTasks);

// Create tasks: Admin and Manager only.
router.post(
  "/",
  authorize("Admin", "Manager"),
  createTask
);

// Get a single task; the controller checks access permissions.
router.get("/:id", getTask);

// Update tasks; the controller checks permissions.
router.put("/:id", updateTask);

// Delete tasks: Admin and Manager only.
// The controller additionally checks team permissions.
router.delete(
  "/:id",
  authorize("Admin", "Manager"),
  deleteTask
);

export default router;