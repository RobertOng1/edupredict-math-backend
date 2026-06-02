import express from "express";
import {
  startQuiz,
  submitAnswer,
  finishQuiz,
} from "../controllers/quizController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/start", protect, authorize("student"), startQuiz);
router.post("/submit-answer", protect, authorize("student"), submitAnswer);
router.post("/finish", protect, authorize("student"), finishQuiz);

export default router;