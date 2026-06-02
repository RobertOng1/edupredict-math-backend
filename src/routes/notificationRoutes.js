import express from "express";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notificationController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadNotificationCount);
router.put("/read-all", protect, markAllNotificationsAsRead);
router.put("/:id/read", protect, markNotificationAsRead);

export default router;