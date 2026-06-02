import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    skillId: {
      type: String,
      required: true,
      index: true,
    },

    question: {
      type: String,
      required: true,
    },

    choices: {
      type: [String],
      required: true,
    },

    correctAnswer: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      default: "",
    },

    difficulty: {
      type: String,
      default: "adaptive",
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Question", questionSchema);