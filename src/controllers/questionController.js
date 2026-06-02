import Question from "../models/Question.js";

export const getQuestions = async (req, res) => {
  try {

    const questions = await Question.find().limit(20);

    res.json(questions);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

export const getQuestionCategories = async (req, res) => {
  try {
    const categories = await Question.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          _id: { $ne: "" },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    res.json({
      success: true,
      categories: categories.map((item) => ({
        name: item._id,
        count: item.count,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};