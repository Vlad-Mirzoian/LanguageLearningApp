const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Word = require("../models/Word");
const Card = require("../models/Card");
const User = require("../models/User");
const Language = require("../models/Language");
const Category = require("../models/Category");
const UserProgress = require("../models/UserProgress");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { body, param, query } = require("express-validator");

// GET /api/cards
router.get(
  "/",
  authenticate,
  [
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
      const query = {};
      if (req.userRole !== "admin") {
        const nativeWordIds = await Word.find({
          languageId: user.nativeLanguageId,
        }).distinct("_id");
        const translationWordIds = await Word.find({
          languageId: { $in: user.learningLanguagesIds },
        }).distinct("_id");
        query.wordId = { $in: nativeWordIds };
        query.translationId = { $in: translationWordIds };
      }
      if (req.query.categoryId) {
        query.categoryId = req.query.categoryId;
      }
      const cards = await Card.find(query)
        .populate("wordId", "text languageId")
        .populate("translationId", "text languageId")
        .populate("categoryId", "name");
      res.json(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
      res
        .status(500)
        .json({ error: `Failed to fetch cards: ${error.message}` });
    }
  }
);

// GET /api/cards/review
router.get(
  "/review",
  authenticate,
  [
    query("languageId")
      .exists({ checkFalsy: true })
      .withMessage("Language is required")
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
      .custom(async (value, { req }) => {
        if (value) {
          const category = await Category.findById(value);
          if (!category) throw new Error("Category not found");
          const progress = await UserProgress.findOne({
            userId: req.userId,
            languageId: req.query.languageId,
            categoryId: value,
          });
          if (!progress?.unlocked) {
            throw new Error("Category is locked");
          }
        }
        return true;
      }),
  ],
  validate,
  authorizeRoles(["user"]),
  async (req, res) => {
    try {
      const { languageId, categoryId } = req.query;
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const learningLanguages = user.learningLanguagesIds;
      if (!Array.isArray(learningLanguages) || learningLanguages.length === 0) {
        return res.status(400).json({
          error: "User must have at least one learning language",
        });
      }
      const nativeLanguageId = user.nativeLanguageId;
      const targetLanguageId = languageId;
      const progressQuery = {
        userId: req.userId,
        languageId: targetLanguageId,
        unlocked: true,
      };
      if (categoryId) progressQuery.categoryId = categoryId;
      const unlockedCategories = await UserProgress.find(
        progressQuery
      ).distinct("categoryId");
      const nativeWordIds = await Word.find({
        languageId: nativeLanguageId,
      }).distinct("_id");
      const translatedWordIds = await Word.find({
        languageId: targetLanguageId,
      }).distinct("_id");
      const query = {
        wordId: { $in: nativeWordIds },
        translationId: { $in: translatedWordIds },
        categoryId: { $in: unlockedCategories },
      };
      if (categoryId) query.categoryId = categoryId;
      const cards = await Card.find(query)
        .populate({
          path: "wordId",
          select: "text languageId",
        })
        .populate({
          path: "translationId",
          select: "text languageId",
        })
        .populate({
          path: "categoryId",
          select: "name order requiredScore",
        });
      let attemptId = null;
      if (categoryId) {
        attemptId = new mongoose.Types.ObjectId().toString();
        await UserProgress.findOneAndUpdate(
          {
            userId: req.userId,
            languageId,
            categoryId,
          },
          {
            $set: { score: 0, attemptId },
          },
          { new: true }
        );
      }

      res.json({ cards, attemptId });
    } catch (error) {
      console.error("Error fetching review cards:", error);
      res
        .status(500)
        .json({ error: `Failed to fetch review cards: ${error.message}` });
    }
  }
);

// POST /api/cards
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  [
    body("wordId")
      .notEmpty()
      .withMessage("Original word is required")
      .isMongoId()
      .withMessage("Invalid word ID")
      .custom(async (value) => {
        const word = await Word.findById(value);
        if (!word) throw new Error("Original word not found");
        return true;
      }),
    body("translationId")
      .notEmpty()
      .withMessage("Translation word is required")
      .isMongoId()
      .withMessage("Invalid translation ID")
      .custom(async (value) => {
        const translation = await Word.findById(value);
        if (!translation) throw new Error("Translation word not found");
        return true;
      }),
    body("categoryId")
      .notEmpty()
      .withMessage("Category is required")
      .isMongoId()
      .withMessage("Invalid category ID")
      .custom(async (value) => {
        const category = await Category.findById(value);
        if (!category) throw new Error("Category not found");
        return true;
      }),
    body("meaning")
      .optional()
      .notEmpty()
      .withMessage("Meaning cannot be empty if provided")
      .trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { wordId, translationId, categoryId, meaning } = req.body;
      const card = new Card({ wordId, translationId, categoryId, meaning });
      await card.save();
      const translation = await Word.findById(translationId);
      const users = await User.find({
        learningLanguagesIds: translation.languageId,
      });
      for (const user of users) {
        await UserProgress.findOneAndUpdate(
          {
            userId: user._id,
            languageId: translation.languageId,
            categoryId,
          },
          {
            $inc: { totalCards: 1 },
            $setOnInsert: { score: 0, maxScore: 0, unlocked: false },
          },
          { upsert: true }
        );
      }
      await card.populate([
        { path: "wordId", select: "text" },
        { path: "translationId", select: "text" },
        { path: "categoryId", select: "name" },
      ]);
      res.status(201).json(card);
    } catch (error) {
      console.error("Error creating card:", error);
      res
        .status(500)
        .json({ error: `Failed to create card: ${error.message}` });
    }
  }
);

// PUT /api/cards/:id/review
router.put(
  "/:id/review",
  authenticate,
  authorizeRoles(["user"]),
  [
    param("id").isMongoId().withMessage("Invalid card ID"),
    body("languageId")
      .notEmpty()
      .withMessage("Language is required")
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
    body("quality")
      .isInt({ min: 1, max: 5 })
      .withMessage("Quality must be an integer between 1 and 5"),
    body("attemptId").optional().isString().withMessage("Invalid attempt ID"),
  ],
  validate,
  async (req, res) => {
    try {
      const { languageId, quality, attemptId } = req.body;
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.learningLanguagesIds?.length) {
        return res
          .status(400)
          .json({ error: "User must have at least one learning language" });
      }
      const nativeWordIds = await Word.find({
        languageId: user.nativeLanguageId,
      }).distinct("_id");
      const translationWordIds = await Word.find({
        languageId,
      }).distinct("_id");
      const card = await Card.findOne({
        _id: req.params.id,
        wordId: { $in: nativeWordIds },
        translationId: { $in: translationWordIds },
      }).populate("categoryId");
      if (!card) return res.status(404).json({ error: "Card not found" });
      let progress = await UserProgress.findOne({
        userId: req.userId,
        languageId,
        categoryId: card.categoryId._id,
      });
      const totalCards = await Card.countDocuments({
        categoryId: card.categoryId._id,
        translationId: { $in: translationWordIds },
      });
      const scorePerCard = totalCards > 0 ? 100 / totalCards : 0;
      if (!progress) {
        progress = await UserProgress.create({
          userId: req.userId,
          languageId,
          categoryId: card.categoryId._id,
          totalCards,
          score: (quality / 5) * scorePerCard,
          maxScore: (quality / 5) * scorePerCard,
          unlocked: card.categoryId.order === 1,
          attemptId: attemptId || new mongoose.Types.ObjectId().toString(),
        });
      } else {
        if (attemptId && progress.attemptId !== attemptId) {
          progress.score = (quality / 5) * scorePerCard;
          progress.attemptId = attemptId;
        } else {
          progress.score += (quality / 5) * scorePerCard;
        }
        if (progress.score > progress.maxScore) {
          progress.maxScore = progress.score;
        }
        await progress.save();
      }
      const nextCategory = await Category.findOne({
        order: card.categoryId.order + 1,
        languageId: card.categoryId.languageId,
      });
      if (nextCategory && progress.maxScore >= card.categoryId.requiredScore) {
        const nextProgress = await UserProgress.findOne({
          userId: req.userId,
          languageId,
          categoryId: nextCategory._id,
        });
        if (!nextProgress) {
          await UserProgress.create({
            userId: req.userId,
            languageId,
            categoryId: nextCategory._id,
            totalCards: await Card.countDocuments({
              categoryId: nextCategory._id,
              translationId: { $in: translationWordIds },
            }),
            score: 0,
            maxScore: 0,
            unlocked: true,
            attemptId: null,
          });
        } else if (!nextProgress.unlocked) {
          await UserProgress.findOneAndUpdate(
            {
              userId: req.userId,
              languageId,
              categoryId: nextCategory._id,
            },
            {
              $set: { unlocked: true },
            },
            { new: true }
          );
        }
      }
      res.json({
        progress: {
          _id: progress._id.toString(),
          userId: progress.userId.toString(),
          languageId: progress.languageId.toString(),
          categoryId: progress.categoryId.toString(),
          totalCards: progress.totalCards,
          score: progress.score,
          maxScore: progress.maxScore,
          unlocked: progress.unlocked,
          attemptId: progress.attemptId,
        },
      });
    } catch (error) {
      console.error("Error reviewing card:", error);
      res
        .status(500)
        .json({ error: `Failed to review card: ${error.message}` });
    }
  }
);

// PUT /api/cards/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  [
    param("id").isMongoId().withMessage("Invalid card ID"),
    body("wordId")
      .optional()
      .notEmpty()
      .withMessage("Original word is required")
      .isMongoId()
      .withMessage("Invalid word ID")
      .custom(async (value) => {
        const word = await Word.findById(value);
        if (!word) throw new Error("Original word not found");
        return true;
      }),
    body("translationId")
      .optional()
      .notEmpty()
      .withMessage("Translation word is required")
      .isMongoId()
      .withMessage("Invalid translation ID")
      .custom(async (value) => {
        const translation = await Word.findById(value);
        if (!translation) throw new Error("Translation word not found");
        return true;
      }),
    body("categoryId")
      .optional()
      .notEmpty()
      .withMessage("Category cannot be empty if provided")
      .isMongoId()
      .withMessage("Invalid category ID")
      .custom(async (value) => {
        const category = await Category.findById(value);
        if (!category) throw new Error("Category not found");
        return true;
      }),
    body("meaning")
      .optional()
      .notEmpty()
      .withMessage("Meaning cannot be empty if provided")
      .trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { wordId, translationId, categoryId, meaning } = req.body;
      const updateData = {};
      if (wordId) updateData.wordId = wordId;
      if (translationId) updateData.translationId = translationId;
      if (categoryId) updateData.categoryId = categoryId;
      if (meaning !== undefined) updateData.meaning = meaning;
      const card = await Card.findById(req.params.id);
      if (!card) return res.status(404).json({ error: "Card not found" });
      const oldCategoryId = card.categoryId;
      const oldTranslation = await Word.findById(card.translationId);
      Object.assign(card, updateData);
      await card.save();
      if (categoryId && !oldCategoryId.equals(categoryId)) {
        const translation = translationId
          ? await Word.findById(translationId)
          : oldTranslation;
        const users = await User.find({
          learningLanguagesIds: translation.languageId,
        });
        for (const user of users) {
          await UserProgress.findOneAndUpdate(
            {
              userId: user._id,
              languageId: translation.languageId,
              categoryId: oldCategoryId,
            },
            {
              $inc: { totalCards: -1 },
            }
          );
          await UserProgress.findOneAndUpdate(
            {
              userId: user._id,
              languageId: translation.languageId,
              categoryId,
            },
            {
              $inc: { totalCards: 1 },
              $setOnInsert: { score: 0, maxScore: 0, unlocked: false },
            },
            {
              $upsert: true,
            }
          );
        }
      }
      await card.populate([
        { path: "wordId", select: "text" },
        { path: "translationId", select: "text" },
        { path: "categoryId", select: "name" },
      ]);
      res.json(card);
    } catch (error) {
      console.error("Error updating card:", error);
      res
        .status(500)
        .json({ error: `Failed to update card: ${error.message}` });
    }
  }
);

// DELETE /api/cards/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [param("id").isMongoId().withMessage("Invalid card ID")],
  validate,
  async (req, res) => {
    try {
      const card = await Card.findById(req.params.id);
      if (!card) return res.status(404).json({ error: "Card not found" });
      const translation = await Word.findById(card.translationId);
      const users = await User.find({
        learningLanguagesIds: translation.languageId,
      });
      for (const user of users) {
        await UserProgress.findOneAndUpdate(
          {
            userId: user._id,
            languageId: translation.languageId,
            categoryId: card.categoryId,
          },
          {
            $inc: { totalCards: -1 },
          }
        );
      }
      await card.deleteOne();
      res.json({ message: "Card deleted" });
    } catch (error) {
      console.error("Error deleting card:", error);
      res
        .status(500)
        .json({ error: `Failed to delete card: ${error.message}` });
    }
  }
);

module.exports = router;
