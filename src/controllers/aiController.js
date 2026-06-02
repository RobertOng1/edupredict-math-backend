import Attempt from "../models/Attempt.js";
import Prediction from "../models/Prediction.js";
import User from "../models/User.js";
import createNotification from "../utils/createNotification.js";

import { predictStudentMastery } from "../services/aiService.js";

const CATEGORY_UI_MAP = {
  "Data Analysis, Statistics, and Probability": "Statistika",
  "Geometry and Spatial Reasoning": "Geometri",
  "Measurement, Area, and Volume": "Pengukuran",
  "Number Sense, Properties, and Operations": "Bilangan",
  "Ratios, Proportions, and Percentages": "Rasio",
  "Algebraic Thinking, Equations, and Inequalities": "Aljabar",
};

const mapCategoryMastery = (categoryMastery = {}) => {
  return Object.entries(categoryMastery).reduce((acc, [key, value]) => {
    const mappedKey = CATEGORY_UI_MAP[key] || key;
    acc[mappedKey] = value;
    return acc;
  }, {});
};

export const runPrediction = async (req, res) => {
  try {
    const studentId = req.user._id;

    const user = await User.findById(studentId);

    const attempts = await Attempt.find({
      student: studentId,
    }).sort({
      createdAt: 1,
    });

    const studentHistory = attempts.map((attempt) => ({
      skill_id: attempt.skillId,
      correctness: attempt.correctness,
      ms_first_response: attempt.msFirstResponse,
      question: attempt.questionText,
    }));

    const prediction = await predictStudentMastery(
      studentHistory,
      user.interests
    );

    const mappedCategoryMastery = mapCategoryMastery(
      prediction.category_mastery || {}
    );

    const masteryValues = Object.values(mappedCategoryMastery).filter(
      (value) => value !== null && value !== undefined
    );

    let averageMastery = 0;

    if (masteryValues.length > 0) {
      averageMastery =
        masteryValues.reduce((sum, value) => sum + value, 0) /
        masteryValues.length;
    }

    let riskLevel = "Low";

    if (averageMastery < 0.3) {
      riskLevel = "Hard";
    } else if (averageMastery < 0.6) {
      riskLevel = "Medium";
    }

    await Prediction.create({
      student: studentId,
      categoryMastery: mappedCategoryMastery,
      explanation: prediction.explanation,
      riskLevel,
    });

    if (riskLevel === "Hard") {
      await createNotification({
        userId: studentId,
        title: "Rekomendasi belajar AI",
        message:
          "AI mendeteksi kamu butuh latihan tambahan. Coba pelajari ulang topik yang masih lemah.",
        type: "recommendation",
      });
    }

    res.json({
      success: true,
      categoryMastery: mappedCategoryMastery,
      explanation: prediction.explanation,
      riskLevel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLatestPrediction = async (req, res) => {
  try {
    const latestPrediction = await Prediction.findOne({
      student: req.user._id,
    }).sort({ createdAt: -1 });

    if (!latestPrediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction belum tersedia",
      });
    }

    res.json({
      success: true,
      prediction: latestPrediction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};