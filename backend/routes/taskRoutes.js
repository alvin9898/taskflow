import { Router } from "express";
import {
  listTasks, getMyTasks, getTask, createTask, updateTask, deleteTask
} from "../controllers/taskController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", listTasks);
router.get("/my", getMyTasks);
router.get("/:id", getTask);
router.post("/", authorize("Manager", "Admin"), createTask);
router.put("/:id", updateTask);
router.delete("/:id", authorize("Manager", "Admin"), deleteTask);

export default router;