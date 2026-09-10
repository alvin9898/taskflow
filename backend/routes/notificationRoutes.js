import { Router } from "express";
import {
  listNotifications, markRead, markAllRead, deleteNotification
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/", listNotifications);
router.put("/:id/read", markRead);
router.put("/read-all", markAllRead);
router.delete("/:id", deleteNotification);

export default router;