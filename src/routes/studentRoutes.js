import express from "express";
import { getStudentDashboard } from "../controllers/studentController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("student"),
  getStudentDashboard
);

export default router;