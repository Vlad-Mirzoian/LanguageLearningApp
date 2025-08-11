const Category = require("../models/Category");
const Language = require("../models/Language");
const User = require("../models/User");
const UserProgress = require("../models/UserProgress");

const userProgressController = {
  async getUserProgress(req, res) {
    try {
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { languageId, categoryId } = req.query;
      if (languageId) {
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
      }
      if (categoryId) {
        const category = await Category.findById(categoryId).lean();
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
      }

      const query = { userId: req.userId };
      if (languageId) query.languageId = languageId;
      if (categoryId) query.categoryId = categoryId;

      const progress = await UserProgress.find(query).lean();
      const formattedProgress = progress.map((p) => ({
        _id: p._id.toString(),
        userId: p.userId.toString(),
        languageId: p.languageId.toString(),
        categoryId: p.categoryId.toString(),
        totalCards: p.totalCards,
        score: p.score,
        maxScore: p.maxScore,
        unlocked: p.unlocked,
      }));
      res.json(formattedProgress);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch user progress: ${error.message}` });
    }
  },
};

module.exports = userProgressController;
