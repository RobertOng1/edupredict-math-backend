import Question from "../models/Question.js";
import Attempt from "../models/Attempt.js";
import QuizSession from "../models/QuizSession.js";
import User from "../models/User.js";
import Prediction from "../models/Prediction.js";
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

const calculateRiskLevel = (categoryMastery = {}) => {
  const masteryValues = Object.values(categoryMastery).filter(
    (value) => value !== null && value !== undefined
  );

  if (masteryValues.length === 0) return "Unknown";

  const averageMastery =
    masteryValues.reduce((sum, value) => sum + value, 0) /
    masteryValues.length;

  if (averageMastery < 0.3) return "Hard";
  if (averageMastery < 0.6) return "Medium";

  return "Low";
};

const buildStudentHistory = async (studentId) => {
  const attempts = await Attempt.find({
    student: studentId,
  }).sort({
    createdAt: 1,
  });

  return attempts.map((attempt) => ({
    skill_id: String(attempt.skillId),
    correctness: attempt.correctness,
    ms_first_response: attempt.msFirstResponse,
    question: attempt.questionText,
  }));
};

export const startQuiz = async (req, res) => {
  try {
    const { category, mode = "learning", limit = 10 } = req.body;

    const filter = category && category !== "Mixed" ? { category } : {};

    const questionCount = await Question.countDocuments(filter);

    if (questionCount === 0) {
      return res.status(404).json({
        message: "Soal untuk kategori ini belum tersedia",
        category: category || "Mixed",
      });
    }

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: Math.min(Number(limit), questionCount) } },
    ]);

    const quizSession = await QuizSession.create({
      student: req.user._id,
      category: category || "Mixed",
      mode,
      questions: questions.map((q) => q._id),
      totalQuestions: questions.length,
    });

    res.status(201).json({
      message: "Quiz started",
      quizSessionId: quizSession._id,
      mode,
      category: category || "Mixed",
      questions: questions.map((q) => ({
        id: q._id,
        skillId: q.skillId,
        question: q.question,
        choices: q.choices,
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to start quiz",
      error: error.message,
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { quizSessionId, questionId, selectedAnswer, responseTime } = req.body;

    const quizSession = await QuizSession.findById(quizSessionId);

    if (!quizSession) {
      return res.status(404).json({
        message: "Quiz session not found",
      });
    }

    if (quizSession.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not allowed to access this quiz",
      });
    }

    if (quizSession.isCompleted) {
      return res.status(400).json({
        message: "Quiz session already completed",
      });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    const alreadyAnswered = quizSession.answers.some(
      (answer) => answer.question.toString() === questionId.toString()
    );

    if (alreadyAnswered) {
      return res.status(400).json({
        message: "Question already answered",
      });
    }

    const isCorrect = Number(selectedAnswer) === Number(question.correctAnswer);

    await Attempt.create({
      student: req.user._id,
      question: question._id,
      skillId: String(question.skillId),
      correctness: isCorrect ? 1 : 0,
      msFirstResponse: responseTime || 0,
      questionText: question.question,
    });

    quizSession.answers.push({
      question: question._id,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      responseTime: responseTime || 0,
      skillId: String(question.skillId),
    });

    quizSession.score = quizSession.answers.filter((a) => a.isCorrect).length;

    await quizSession.save();

    let aiIntervention = null;
    let mappedCategoryMastery = null;
    let riskLevel = "Unknown";

    if (!isCorrect && quizSession.mode === "learning") {
  try {
    const user = await User.findById(req.user._id);
    const studentHistory = await buildStudentHistory(req.user._id);

    if (studentHistory.length > 0) {
      const prediction = await predictStudentMastery(
        studentHistory,
        user?.interests || ""
      );

      mappedCategoryMastery = mapCategoryMastery(
        prediction?.category_mastery || {}
      );

      riskLevel = calculateRiskLevel(mappedCategoryMastery);

      await Prediction.create({
        student: req.user._id,
        categoryMastery: mappedCategoryMastery,
        explanation: prediction?.explanation || null,
        riskLevel,
      });

      if (prediction?.explanation) {
        aiIntervention = {
          concept: question.category || "Matematika",
          explanation: prediction.explanation,
          categoryMastery: mappedCategoryMastery,
          riskLevel,
          target: "next_question",
        };
      }
    }
  } catch (predictionError) {
    console.error("AI prediction failed:", predictionError.message);
  }
}

    res.json({
      message: "Answer submitted",
      isCorrect,
      correctAnswer: question.correctAnswer,
      selectedAnswer,
      explanationRequired: Boolean(aiIntervention),
      aiIntervention,
      prediction: mappedCategoryMastery
        ? {
            categoryMastery: mappedCategoryMastery,
            riskLevel,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit answer",
      error: error.message,
    });
  }
};

export const finishQuiz = async (req, res) => {
  try {
    const { quizSessionId } = req.body;

    const quizSession = await QuizSession.findById(quizSessionId);

    if (!quizSession) {
      return res.status(404).json({
        message: "Quiz session not found",
      });
    }

    if (quizSession.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not allowed to finish this quiz",
      });
    }

    if (quizSession.isCompleted) {
      return res.status(400).json({
        message: "Quiz session already completed",
      });
    }

    const total = quizSession.totalQuestions || quizSession.answers.length;
    const score = quizSession.score;
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

    let xpEarned = score * 10;

    if (accuracy === 100) xpEarned += 50;
    if (accuracy >= 80) xpEarned += 25;

    quizSession.xpEarned = xpEarned;
    quizSession.isCompleted = true;

    await quizSession.save();

    const user = await User.findById(req.user._id);

    user.xp = (user.xp || 0) + xpEarned;
    user.level = Math.floor(user.xp / 100) + 1;
    user.streak = user.streak || 0;

    await user.save();

    await createNotification({
      userId: req.user._id,
      title: "Quiz selesai",
      message: `Kamu menyelesaikan quiz dengan akurasi ${accuracy}%. XP bertambah +${xpEarned}.`,
      type: "quiz",
    });

    if (accuracy === 100) {
      await createNotification({
        userId: req.user._id,
        title: "Perfect Score!",
        message: "Keren! Kamu berhasil mendapatkan nilai sempurna di quiz ini.",
        type: "achievement",
      });
    }

    res.json({
      message: "Quiz finished",
      result: {
        score,
        totalQuestions: total,
        accuracy,
        xpEarned,
        level: user.level,
        streak: user.streak,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to finish quiz",
      error: error.message,
    });
  }
};