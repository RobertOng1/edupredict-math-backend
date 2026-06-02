import Class from "../models/Class.js";
import User from "../models/User.js";
import Attempt from "../models/Attempt.js";
import QuizSession from "../models/QuizSession.js";
import Prediction from "../models/Prediction.js";

export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const classes = await Class.find({ teacher: teacherId }).populate(
      "students",
      "fullName email photoUrl"
    );

    const studentIds = classes.flatMap((cls) =>
      cls.students.map((student) => student._id)
    );

    const totalStudents = studentIds.length;

    const predictions = await Prediction.find({
      student: { $in: studentIds },
    }).sort({ createdAt: -1 });

    const latestPredictionMap = new Map();

    predictions.forEach((prediction) => {
      const studentId = prediction.student.toString();

      if (!latestPredictionMap.has(studentId)) {
        latestPredictionMap.set(studentId, prediction);
      }
    });

    const studentsNeedAttention = [...latestPredictionMap.values()].filter(
      (prediction) => prediction.riskLevel === "Hard"
    ).length;

    const totalMastery = [...latestPredictionMap.values()].map((prediction) => {
      const values = Object.values(prediction.categoryMastery || {}).filter(
        (value) => value !== null
      );

      if (values.length === 0) return 0;

      return values.reduce((sum, value) => sum + value, 0) / values.length;
    });

    const averageProgress =
      totalMastery.length > 0
        ? Math.round(
            (totalMastery.reduce((sum, value) => sum + value, 0) /
              totalMastery.length) *
              100
          )
        : 0;

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const weeklyCompletedQuiz = await QuizSession.countDocuments({
      student: { $in: studentIds },
      isCompleted: true,
      updatedAt: { $gte: startOfWeek },
    });

    const classMonitoring = await Promise.all(
      classes.map(async (cls) => {
        const classStudentIds = cls.students.map((student) => student._id);

        const classPredictions = [...latestPredictionMap.values()].filter(
          (prediction) =>
            classStudentIds
              .map((id) => id.toString())
              .includes(prediction.student.toString())
        );

        const classMasteryValues = classPredictions.map((prediction) => {
          const values = Object.values(prediction.categoryMastery || {}).filter(
            (value) => value !== null
          );

          if (values.length === 0) return 0;

          return values.reduce((sum, value) => sum + value, 0) / values.length;
        });

        const classProgress =
          classMasteryValues.length > 0
            ? Math.round(
                (classMasteryValues.reduce((sum, value) => sum + value, 0) /
                  classMasteryValues.length) *
                  100
              )
            : 0;

        return {
          id: cls._id,
          className: cls.className,
          classCode: cls.classCode,
          totalStudents: cls.students.length,
          averageProgress: classProgress,
        };
      })
    );

    res.json({
      success: true,
      dashboard: {
        summary: {
          totalStudents,
          averageProgress,
          studentsNeedAttention,
          weeklyCompletedQuiz,
        },
        classMonitoring,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getClassAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId).populate(
      "students",
      "fullName email photoUrl xp streak level"
    );

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Kelas tidak ditemukan",
      });
    }

    if (classData.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke kelas ini",
      });
    }

    const studentAnalytics = await Promise.all(
      classData.students.map(async (student) => {
        const totalAttempts = await Attempt.countDocuments({
          student: student._id,
        });

        const correctAttempts = await Attempt.countDocuments({
          student: student._id,
          correctness: 1,
        });

        const completedQuizzes = await QuizSession.countDocuments({
          student: student._id,
          isCompleted: true,
        });

        const latestPrediction = await Prediction.findOne({
          student: student._id,
        }).sort({ createdAt: -1 });

        const accuracy =
          totalAttempts > 0
            ? Math.round((correctAttempts / totalAttempts) * 100)
            : 0;

        const progress =
          totalAttempts > 0
            ? Math.min(Math.round((totalAttempts / 500) * 100), 100)
            : 0;

        return {
          student: {
            id: student._id,
            fullName: student.fullName,
            email: student.email,
            photoUrl: student.photoUrl,
            xp: student.xp,
            streak: student.streak,
            level: student.level,
          },
          statistics: {
            totalAttempts,
            correctAttempts,
            completedQuizzes,
            accuracy,
            progress,
          },
          riskLevel: latestPrediction?.riskLevel || "Unknown",
          categoryMastery: latestPrediction?.categoryMastery || {},
          lastPredictionAt: latestPrediction?.createdAt || null,
        };
      })
    );

    const hardRiskStudents = studentAnalytics.filter(
      (item) => item.riskLevel === "Hard"
    ).length;

    const mediumRiskStudents = studentAnalytics.filter(
      (item) => item.riskLevel === "Medium"
    ).length;

    const lowRiskStudents = studentAnalytics.filter(
      (item) => item.riskLevel === "Low"
    ).length;

    const averageAccuracy =
      studentAnalytics.length > 0
        ? Math.round(
            studentAnalytics.reduce(
              (sum, item) => sum + item.statistics.accuracy,
              0
            ) / studentAnalytics.length
          )
        : 0;

    res.json({
      success: true,
      class: {
        id: classData._id,
        className: classData.className,
        classCode: classData.classCode,
        totalStudents: classData.students.length,
      },
      summary: {
        averageAccuracy,
        hardRiskStudents,
        mediumRiskStudents,
        lowRiskStudents,
      },
      students: studentAnalytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStudentDetailAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId).select("-password");

    if (!student || student.role !== "student") {
      return res.status(404).json({
        success: false,
        message: "Siswa tidak ditemukan",
      });
    }

    const totalAttempts = await Attempt.countDocuments({ student: studentId });

    const correctAttempts = await Attempt.countDocuments({
      student: studentId,
      correctness: 1,
    });

    const completedQuizzes = await QuizSession.find({
      student: studentId,
      isCompleted: true,
    })
      .sort({ updatedAt: -1 })
      .limit(10);

    const latestPrediction = await Prediction.findOne({
      student: studentId,
    }).sort({ createdAt: -1 });

    const attempts = await Attempt.find({ student: studentId });

    const skillMap = {};

    attempts.forEach((attempt) => {
      if (!skillMap[attempt.skillId]) {
        skillMap[attempt.skillId] = {
          skillId: attempt.skillId,
          total: 0,
          correct: 0,
        };
      }

      skillMap[attempt.skillId].total += 1;

      if (attempt.correctness === 1) {
        skillMap[attempt.skillId].correct += 1;
      }
    });

    const skillPerformance = Object.values(skillMap).map((skill) => ({
      ...skill,
      accuracy:
        skill.total > 0
          ? Math.round((skill.correct / skill.total) * 100)
          : 0,
    }));

    const accuracy =
      totalAttempts > 0
        ? Math.round((correctAttempts / totalAttempts) * 100)
        : 0;

    res.json({
      success: true,
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        photoUrl: student.photoUrl,
        interests: student.interests,
        xp: student.xp,
        level: student.level,
        streak: student.streak,
      },
      statistics: {
        totalAttempts,
        correctAttempts,
        accuracy,
        completedQuizCount: completedQuizzes.length,
      },
      latestPrediction,
      skillPerformance,
      recentQuizzes: completedQuizzes.map((quiz) => ({
        id: quiz._id,
        category: quiz.category,
        mode: quiz.mode,
        score: quiz.score,
        totalQuestions: quiz.totalQuestions,
        xpEarned: quiz.xpEarned,
        completedAt: quiz.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};