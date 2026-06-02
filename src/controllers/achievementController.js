import User from "../models/User.js";
import QuizSession from "../models/QuizSession.js";
import createNotification from "../utils/createNotification.js";

export const getAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    const totalCompletedQuiz = await QuizSession.countDocuments({
      student: req.user._id,
      isCompleted: true,
    });

    const perfectQuiz = await QuizSession.exists({
      student: req.user._id,
      isCompleted: true,
      $expr: {
        $eq: ["$score", "$totalQuestions"],
      },
    });

    const logicQuiz = await QuizSession.exists({
  student: req.user._id,
  isCompleted: true,
  category: "Rasio",
});

    const speedQuiz = await QuizSession.exists({
      student: req.user._id,
      isCompleted: true,
      "answers.responseTime": { $lte: 300000 },
    });

    const achievements = [
      {
        key: "streak",
        title: "5-Day Streak",
        desc: "Belajar selama 5 hari berturut-turut",
        unlocked: (user.streak || 0) >= 5,
      },
      {
        key: "perfect-score",
        title: "Perfect Score",
        desc: "Dapatkan nilai 100 di Quiz",
        unlocked: Boolean(perfectQuiz),
      },
      {
        key: "quick-learner",
        title: "Quick Learner",
        desc: "Naikkan progress dengan cepat",
        unlocked: (user.xp || 0) >= 100,
      },
      {
        key: "math-master",
        title: "Math Master",
        desc: "Selesaikan semua Quiz dengan nilai 100",
        unlocked: Boolean(perfectQuiz) && totalCompletedQuiz >= 10,
      },
      {
        key: "logic-genius",
        title: "Logic Genius",
        desc: "Selesaikan Quiz Rasio",
        unlocked: Boolean(logicQuiz),
      },
      {
        key: "speed-solver",
        title: "Speed Solver",
        desc: "Selesaikan Quiz kurang dari 5 menit",
        unlocked: Boolean(speedQuiz),
      },
    ];

    const savedAchievements = user.achievements || [];

    const newlyUnlocked = achievements.filter(
      (achievement) =>
        achievement.unlocked && !savedAchievements.includes(achievement.key)
    );

    if (newlyUnlocked.length > 0) {
      for (const achievement of newlyUnlocked) {
        await createNotification({
          userId: user._id,
          title: "Achievement Unlocked!",
          message: `Kamu membuka achievement ${achievement.title}.`,
          type: "achievement",
        });
      }

      user.achievements = [
        ...new Set([
          ...savedAchievements,
          ...newlyUnlocked.map((item) => item.key),
        ]),
      ];

      await user.save();
    }

    res.json({
      message: "Achievements berhasil diambil",
      achievements,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};