const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Language = require("../models/Language");
const Category = require("../models/Category");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { query } = require("express-validator");
const UserProgress = require("../models/UserProgress");

// GET /api/user-progress
router.get(
  "/",
  authenticate,
  authorizeRoles(["user"]),
  [
    query("languageId")
      .optional()
      .isMongoId()
      .withMessage("Invalid language ID")
      .custom(async (value, { req }) => {
        const language = await Language.findById(value);
        if (!language) throw new Error("Language not found");
        const user = await User.findById(req.userId);
        if (
          !user.nativeLanguageId.equals(value) &&
          !user.learningLanguagesIds.some((id) => id.equals(value))
        ) {
          throw new Error("Access to this language is restricted");
        }
        return true;
      }),
    query("categoryId")
      .optional()
      .isMongoId()
      .withMessage("Invalid category ID")
      .custom(async (value) => {
        const category = await Category.findById(value);
        if (!category) throw new Error("Category not found");
        return true;
      }),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { languageId, categoryId } = req.query;
      const query = { userId: req.userId };
      if (languageId) query.languageId = languageId;
      if (categoryId) query.categoryId = categoryId;
      const progress = await UserProgress.find(query);
      res.json(
        progress.map((p) => ({
          _id: p._id.toString(),
          userId: p.userId.toString(),
          languageId: p.languageId.toString(), 
          categoryId: p.categoryId.toString(),
          totalCards: p.totalCards,
          score: p.score,
          maxScore: p.maxScore,
          unlocked: p.unlocked,
        }))
      );
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res
        .status(500)
        .json({ error: `Failed to fetch user progress: ${error.message}` });
    }
  }
);

module.exports = router;
