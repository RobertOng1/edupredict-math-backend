import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Question from "../models/Question.js";

dotenv.config();

const CATEGORY_UI_MAP = {
  "Data Analysis, Statistics, and Probability": "Statistika",
  "Geometry and Spatial Reasoning": "Geometri",
  "Measurement, Area, and Volume": "Pengukuran",
  "Number Sense, Properties, and Operations": "Bilangan",
  "Ratios, Proportions, and Percentages": "Rasio",
  "Algebraic Thinking, Equations, and Inequalities": "Aljabar",
  "Miscellaneous / Other": "Lainnya",
};

const __dirname = path.resolve();

const questionsPath = path.join(__dirname, "src/data/all_questions.json");
const categoriesPath = path.join(__dirname, "src/data/top_category.json");

const buildSkillCategoryMap = (categories) => {
  const map = {};

  categories.forEach((category) => {
    const uiCategory = CATEGORY_UI_MAP[category.title] || "Lainnya";

    category.skill_id_included.forEach((skillId) => {
      map[String(skillId)] = uiCategory;
    });
  });

  return map;
};

const importQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const rawQuestions = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
    const rawCategories = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));

    const skillCategoryMap = buildSkillCategoryMap(rawCategories);

    const formattedQuestions = rawQuestions.map((item) => {
      const skillId = String(item.skill_id);
      const category = skillCategoryMap[skillId] || "Lainnya";

      return {
        skillId,
        question: item.question,
        choices: item.choices,
        correctAnswer: Number(item.correct_answer),
        category,
        difficulty: "adaptive",
      };
    });

    await Question.deleteMany({});
    await Question.insertMany(formattedQuestions);

    const stats = await Question.aggregate([
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    console.log(`Imported ${formattedQuestions.length} questions`);
    console.table(stats);

    process.exit(0);
  } catch (error) {
    console.error("Import questions failed:", error);
    process.exit(1);
  }
};

importQuestions();