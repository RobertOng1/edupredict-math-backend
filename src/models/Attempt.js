import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
    skillId: {
      type: String,
      required: true,
    },
    correctness: {
      type: Number,
      enum: [0, 1],
      required: true,
    },
    msFirstResponse: {
      type: Number,
      required: true,
    },
    questionText: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Attempt", attemptSchema);