import User from "../models/User.js";
import Attempt from "../models/Attempt.js";
import QuizSession from "../models/QuizSession.js";
import Prediction from "../models/Prediction.js";
import Question from "../models/Question.js";

const dayNamesID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const dayNamesShort = ["S", "M", "T", "W", "T", "F", "S"];

const getStartOfDay = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfDay = (date = new Date()) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const calculateAccuracy = (score, totalQuestions) => {
  if (!totalQuestions) return 0;
  return Math.round((score / totalQuestions) * 100);
};

const calculateStudyMinutes = (sessions) => {
  const totalMs = sessions.reduce((sessionSum, session) => {
    const answerMs = session.answers.reduce((answerSum, answer) => {
      return answerSum + (answer.responseTime || 0);
    }, 0);

    return sessionSum + answerMs;
  }, 0);

  return Math.round(totalMs / 60000);
};

const calculateCurrentStreak = async (studentId) => {
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const hasQuiz = await QuizSession.exists({
      student: studentId,
      isCompleted: true,
      updatedAt: {
        $gte: getStartOfDay(date),
        $lte: getEndOfDay(date),
      },
    });

    if (hasQuiz) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

const buildWeeklyChart = async (studentId) => {
  const chart = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const sessions = await QuizSession.find({
      student: studentId,
      isCompleted: true,
      updatedAt: {
        $gte: getStartOfDay(date),
        $lte: getEndOfDay(date),
      },
    });

    const totalScore = sessions.reduce((sum, session) => {
      return sum + (session.score || 0);
    }, 0);

    const totalQuestions = sessions.reduce((sum, session) => {
      return sum + (session.totalQuestions || 0);
    }, 0);

    chart.push({
      day: dayNamesID[date.getDay()],
      value: calculateAccuracy(totalScore, totalQuestions),
    });
  }

  return chart;
};

const buildDailyQuest = async (studentId) => {
  const todaySessions = await QuizSession.find({
    student: studentId,
    isCompleted: true,
    updatedAt: {
      $gte: getStartOfDay(),
      $lte: getEndOfDay(),
    },
  });

  const quizToday = todaySessions.length;

  const hasScore80 = todaySessions.some((session) => {
    return calculateAccuracy(session.score, session.totalQuestions) >= 80;
  });

  const studyMinutes = calculateStudyMinutes(todaySessions);

  return {
    resetAt: getEndOfDay(),
    quests: [
      {
        key: "complete_3_quiz",
        title: "Selesaikan 3 quiz",
        current: quizToday,
        target: 3,
        completed: quizToday >= 3,
      },
      {
        key: "score_80",
        title: "Dapatkan skor 80%",
        current: hasScore80 ? 1 : 0,
        target: 1,
        completed: hasScore80,
      },
      {
        key: "study_20_minutes",
        title: "Belajar selama 20 menit",
        current: studyMinutes,
        target: 20,
        completed: studyMinutes >= 20,
      },
    ],
  };
};

const buildWeeklyStreak = async (studentId) => {
  const weeklyStreak = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const hasQuiz = await QuizSession.exists({
      student: studentId,
      isCompleted: true,
      updatedAt: {
        $gte: getStartOfDay(date),
        $lte: getEndOfDay(date),
      },
    });

    weeklyStreak.push({
      day: dayNamesShort[date.getDay()],
      active: Boolean(hasQuiz),
      today: new Date().toDateString() === date.toDateString(),
    });
  }

  return weeklyStreak;
};

const buildCategoryProgress = async (studentId) => {
  const categories = [
    "Statistika",
    "Geometri",
    "Pengukuran",
    "Bilangan",
    "Rasio",
    "Aljabar",
  ];

  const attempts = await Attempt.find({ student: studentId }).populate(
    "question",
    "category"
  );

  const result = {};

  categories.forEach((category) => {
    result[category] = {
      total: 0,
      correct: 0,
      progress: 0,
    };
  });

  attempts.forEach((attempt) => {
    const category = attempt.question?.category;

    if (!category || !result[category]) return;

    result[category].total += 1;

    if (attempt.correctness === 1) {
      result[category].correct += 1;
    }
  });

  categories.forEach((category) => {
    const item = result[category];

    item.progress =
      item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
  });

  const attemptedValues = categories
    .map((category) => result[category])
    .filter((item) => item.total > 0);

  result["Healthy Mix"] = {
    total: attemptedValues.reduce((sum, item) => sum + item.total, 0),
    correct: attemptedValues.reduce((sum, item) => sum + item.correct, 0),
    progress:
      attemptedValues.length > 0
        ? Math.round(
            (attemptedValues.reduce((sum, item) => sum + item.progress, 0) /
              attemptedValues.length)
          )
        : 0,
  };

  return result;
};

export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    const user = await User.findById(studentId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student tidak ditemukan",
      });
    }

    const targetQuestions = await Question.countDocuments();

    const totalAttempts = await Attempt.countDocuments({
      student: studentId,
    });

    const correctAttempts = await Attempt.countDocuments({
      student: studentId,
      correctness: 1,
    });

    const completedSessions = await QuizSession.find({
      student: studentId,
      isCompleted: true,
    });

    const completedQuizzes = completedSessions.length;

    const accuracy =
      totalAttempts > 0
        ? Math.round((correctAttempts / totalAttempts) * 100)
        : 0;

    const progress =
      targetQuestions > 0
        ? Math.min(Math.round((totalAttempts / targetQuestions) * 100), 100)
        : 0;

    const latestPrediction = await Prediction.findOne({
      student: studentId,
    }).sort({ createdAt: -1 });

    const streak = await calculateCurrentStreak(studentId);
    const chart = await buildWeeklyChart(studentId);
    const dailyQuest = await buildDailyQuest(studentId);
    const weeklyStreak = await buildWeeklyStreak(studentId);

    if (user.streak !== streak) {
      user.streak = streak;
      await user.save();
    }

    const categoryProgress = await buildCategoryProgress(studentId);

    res.json({
      success: true,
      dashboard: {
        student: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          photoUrl: user.photoUrl,
          interests: user.interests,
          level: user.level,
          xp: user.xp,
          streak,
        },
        statistics: {
          totalAttempts,
          correctAttempts,
          completedQuizzes,
          accuracy,
          progress,
          targetQuestions,
        },
        aiPrediction: latestPrediction || null,
        categoryProgress,
        chart,
        dailyQuest,
        weeklyStreak,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};