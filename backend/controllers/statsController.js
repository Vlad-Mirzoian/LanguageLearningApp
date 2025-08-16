const Attempt = require("../models/Attempt");
const Language = require("../models/Language");
const User = require("../models/User");
const UserProgress = require("../models/UserProgress");

const statsController = {
  async getStats(req, res) {
    try {
      const { languageId } = req.query;
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const language = await Language.findById(languageId).lean();
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      if (
        !user.nativeLanguageId.equals(languageId) &&
        !user.learningLanguagesIds.some((id) => id.equals(languageId))
      ) {
        return res
          .status(403)
          .json({ error: "Access to this language is restricted" });
      }

      const progressQuery = { userId: req.userId };
      progressQuery.languageId = languageId;
      const progress = await UserProgress.find(progressQuery)
        .populate({
          path: "categoryId",
          select: "name order",
        })
        .lean();

      const attemptQuery = { userId: req.userId };
      attemptQuery.languageId = languageId;
      const attempts = await Attempt.find(attemptQuery)
        .populate({
          path: "userId",
          select: "username avatar",
        })
        .populate({
          path: "languageId",
          select: "name",
        })
        .populate({
          path: "categoryId",
          select: "name order",
        })
        .lean();

      const statsByType = attempts.reduce((acc, attempt) => {
        if (!acc[attempt.type]) {
          acc[attempt.type] = { correctAnswers: 0, totalAnswers: 0 };
        }
        acc[attempt.type].correctAnswers += attempt.correctAnswers;
        acc[attempt.type].totalAnswers += attempt.totalAnswers;
        return acc;
      }, {});

      res.json({
        progress,
        statsByType,
        attempts,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch statistics: ${error.message}` });
    }
  },
};

module.exports = statsController;
