import User from "../models/User.js";

export const getLeaderboard = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("fullName email xp gender photoUrl")
      .sort({ xp: -1 })
      .limit(50);

    const leaderboard = students.map((student, index) => ({
      rank: index + 1,
      id: student._id,
      name: student.fullName,
      email: student.email,
      xp: student.xp || 0,
      gender: student.gender || "male",
      photoUrl: student.photoUrl || "",
      active: String(student._id) === String(req.user._id),
    }));

    res.json({
      message: "Leaderboard berhasil diambil",
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};