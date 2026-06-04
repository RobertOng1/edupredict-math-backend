import express from "express";
import {
  createClass,
  getTeacherClasses,
  getClassDetail,
  joinClass,
  getMyClasses,
  leaveClass,
  deleteClass,
  removeStudentFromClass,
} from "../controllers/classController.js";

import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("teacher"), createClass);
router.get("/", protect, authorize("teacher"), getTeacherClasses);

router.get("/my", protect, authorize("student"), getMyClasses);
router.post("/join", protect, authorize("student"), joinClass);
router.delete("/:classId/leave", protect, authorize("student"), leaveClass);

router.get("/:classId", protect, authorize("teacher"), getClassDetail);
router.delete("/:classId", protect, authorize("teacher"), deleteClass);

router.delete(
  "/:classId/students/:studentId",
  protect,
  authorize("teacher"),
  removeStudentFromClass
);

export default router;