import express from "express";
import {
  getTeacherDashboard,
  getClassAnalytics,
  getStudentDetailAnalytics,
} from "../controllers/teacherController.js";

import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, authorize("teacher"), getTeacherDashboard);

router.get(
  "/classes/:classId/analytics",
  protect,
  authorize("teacher"),
  getClassAnalytics
);

router.get(
  "/students/:studentId/analytics",
  protect,
  authorize("teacher"),
  getStudentDetailAnalytics
);

export default router;