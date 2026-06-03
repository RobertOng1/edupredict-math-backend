import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const register = async (req, res) => {
  try {
    const { fullName, email, password, role, interests } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        message: "Nama, email, password, dan role wajib diisi",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "Email sudah digunakan",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      interests: interests || "",
    });

    res.status(201).json({
      message: "Register berhasil",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        interests: user.interests,
      },
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email dan password wajib diisi",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    res.json({
      message: "Login berhasil",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        interests: user.interests,
        xp: user.xp,
        streak: user.streak,
        level: user.level,
      },
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    res.json({
      message: "Profile berhasil diambil",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        interests: user.interests,
        xp: user.xp,
        streak: user.streak,
        level: user.level,
        birthDate: user.birthDate,
        gender: user.gender,
        photoUrl: user.photoUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      birthDate,
      gender,
      interests,
      photoUrl,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (birthDate !== undefined) user.birthDate = birthDate;
    if (gender !== undefined) user.gender = gender;
    if (interests !== undefined) user.interests = interests;
    if (photoUrl !== undefined) user.photoUrl = photoUrl;

    await user.save();

    res.json({
      message: "Profile berhasil diperbarui",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        interests: user.interests,
        xp: user.xp,
        streak: user.streak,
        level: user.level,
        birthDate: user.birthDate,
        gender: user.gender,
        photoUrl: user.photoUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Password lama dan password baru wajib diisi",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password baru minimal 6 karakter",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Password lama tidak sesuai",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email wajib diisi",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Email tidak terdaftar",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Reset Password EduPredict Math</h2>
        <p>Halo ${user.fullName},</p>
        <p>Klik tombol di bawah ini untuk reset password kamu.</p>
        <a href="${resetUrl}" 
          style="display:inline-block;padding:12px 18px;background:#651DFF;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
          Reset Password
        </a>
        <p>Link ini berlaku selama 15 menit.</p>
        <p>Jika kamu tidak meminta reset password, abaikan email ini.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Reset Password EduPredict Math",
      html,
    });

    res.json({
      message: "Link reset password sudah dikirim ke email kamu",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Gagal mengirim email reset password",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password baru wajib diisi",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password minimal 6 karakter",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Token reset password tidak valid atau sudah expired",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Gagal reset password",
    });
  }
};