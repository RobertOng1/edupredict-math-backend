import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher"],
      required: true,
    },
    gender: {
      type: String,
      default: "",
    },
    birthDate: {
      type: String,
      default: "",
    },
    interests: {
      type: String,
      default: "",
    },
    photoUrl: {
      type: String,
      default: "",
    },
    xp: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    achievements: {
      type: [String],
      default: [],
    },
    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpire: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);