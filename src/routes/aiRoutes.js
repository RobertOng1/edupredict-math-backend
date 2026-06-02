import express from "express";
import { protect } from "../middlewares/authMiddleware.js";

import {
  runPrediction,
  getLatestPrediction,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/predict", protect, runPrediction);
router.get("/latest", protect, getLatestPrediction);

export default router;