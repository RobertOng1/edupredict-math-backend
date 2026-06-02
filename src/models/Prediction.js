import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    categoryMastery: {
      type: Object,
      default: {},
    },

    explanation: {
      type: String,
      default: null,
    },

    riskLevel: {
      type: String,
      default: "Unknown",
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Prediction", predictionSchema);