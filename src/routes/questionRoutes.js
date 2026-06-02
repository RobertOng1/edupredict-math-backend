import express from "express";
import {
  getQuestions,
  getQuestionCategories,
} from "../controllers/questionController.js";

const router = express.Router();

router.get("/", getQuestions);
router.get("/categories", getQuestionCategories);

export default router;