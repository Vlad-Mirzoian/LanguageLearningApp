const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Category = require("../models/Category");
const Word = require("../models/Word");
const Card = require("../models/Card");
const Language = require("../models/Language");
const UserProgress = require("../models/UserProgress");
const Attempt = require("../models/Attempt");

const cardController = {
  async getCards(req, res) {
    try {
      const { categoryId, example, limit = 20, skip = 0 } = req.query;
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (categoryId) {
        const category = await Category.findById(categoryId).lean();
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
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

      if (categoryId) query.categoryId = categoryId;
      if (example) query.example = { $regex: example, $options: "i" };

      const [cards, total] = await Promise.all([
        Card.find(query)
          .populate("wordId", "text languageId")
          .populate("translationId", "text languageId")
          .populate("categoryId", "name")
          .skip(skip)
          .limit(limit)
          .lean(),
        Card.countDocuments(query),
      ]);

      res.json({ cards, total });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch cards: ${error.message}` });
    }
  },

  async getReviewCards(req, res) {
    try {
      const { languageId, categoryId } = req.query;

      const [user, language, category] = await Promise.all([
        User.findById(req.userId),
        Language.findById(languageId).lean(),
        categoryId ? Category.findById(categoryId).lean() : null,
      ]);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
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

      if (categoryId) {
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
        const progress = await UserProgress.findOne({
          userId: req.userId,
          languageId,
          categoryId,
        }).lean();
        if (!progress?.unlocked) {
          return res.status(403).json({ error: "Category is locked" });
        }
      }

      const [nativeWordIds, translatedWordIds] = await Promise.all([
        Word.find({
          languageId: user.nativeLanguageId,
        }).distinct("_id"),
        Word.find({
          languageId,
        }).distinct("_id"),
      ]);

      const progressQuery = {
        userId: req.userId,
        languageId,
        unlocked: true,
      };
      if (categoryId) progressQuery.categoryId = categoryId;
      const unlockedCategories = await UserProgress.find(
        progressQuery
      ).distinct("categoryId");

      const query = {
        wordId: { $in: nativeWordIds },
        translationId: { $in: translatedWordIds },
        categoryId: { $in: unlockedCategories },
      };

      const cards = await Card.find(query)
        .populate({ path: "wordId", select: "text languageId" })
        .populate({ path: "translationId", select: "text languageId" })
        .populate({ path: "categoryId", select: "name order requiredScore" })
        .lean();
      let attemptId = null;
      if (categoryId) {
        attemptId = uuidv4();
      }
      res.json({ cards, attemptId });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch review cards: ${error.message}` });
    }
  },

  async getTestCards(req, res) {
    try {
      const { languageId, categoryId } = req.query;

      const [user, language, category] = await Promise.all([
        User.findById(req.userId),
        Language.findById(languageId).lean(),
        categoryId ? Category.findById(categoryId).lean() : null,
      ]);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
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

      if (categoryId) {
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
        const progress = await UserProgress.findOne({
          userId: req.userId,
          languageId,
          categoryId,
        }).lean();
        if (!progress?.unlocked) {
          return res.status(403).json({ error: "Category is locked" });
        }
      }

      const [nativeWordIds, translatedWordIds] = await Promise.all([
        Word.find({
          languageId: user.nativeLanguageId,
        }).distinct("_id"),
        Word.find({
          languageId,
        }).distinct("_id"),
      ]);
      const progressQuery = {
        userId: req.userId,
        languageId,
        unlocked: true,
      };
      if (categoryId) progressQuery.categoryId = categoryId;
      const unlockedCategories = await UserProgress.find(
        progressQuery
      ).distinct("categoryId");

      const query = {
        wordId: { $in: nativeWordIds },
        translationId: { $in: translatedWordIds },
        categoryId: { $in: unlockedCategories },
      };

      const cards = await Card.find(query)
        .populate({ path: "wordId", select: "text languageId" })
        .populate({ path: "translationId", select: "text languageId" })
        .populate({ path: "categoryId", select: "name order requiredScore" })
        .lean();

      const allTranslations = await Word.find({ languageId })
        .select("text")
        .lean();

      const testCards = cards.map((card) => {
        const correctTranslation = card.translationId.text;
        const otherOptions = allTranslations
          .filter((t) => t.text !== correctTranslation)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((t) => ({ text: t.text, isCorrect: false }));

        const options = [
          { text: correctTranslation, isCorrect: true },
          ...otherOptions,
        ].sort(() => Math.random() - 0.5);

        return {
          _id: card._id,
          word: card.wordId,
          category: card.categoryId,
          example: card.example,
          options,
        };
      });

      const attemptId = uuidv4();
      res.json({ cards: testCards, attemptId });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch test cards: ${error.message}` });
    }
  },

  async createCard(req, res) {
    try {
      const { wordId, translationId, categoryId, example } = req.body;
      const [word, translation, category] = await Promise.all([
        Word.findById(wordId).lean(),
        Word.findById(translationId).lean(),
        Category.findById(categoryId).lean(),
      ]);
      if (!word) {
        return res.status(404).json({ error: "Original word not found" });
      }
      if (!translation) {
        return res.status(404).json({ error: "Translation word not found" });
      }
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const card = new Card({ wordId, translationId, categoryId, example });
      await card.save();

      const users = await User.find({
        learningLanguagesIds: translation.languageId,
      }).lean();
      if (users.length > 0) {
        await UserProgress.updateMany(
          {
            userId: { $in: users.map((u) => u._id) },
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
      res
        .status(500)
        .json({ error: `Failed to create card: ${error.message}` });
    }
  },

  async submitCard(req, res) {
    try {
      const { id } = req.params;
      const { languageId, answer, attemptId, type } = req.body;

      const [user, language] = await Promise.all([
        User.findById(req.userId),
        Language.findById(languageId).lean(),
      ]);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.learningLanguagesIds?.length) {
        return res
          .status(400)
          .json({ error: "User must have at least one learning language" });
      }
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

      const [nativeWordIds, translationWordIds] = await Promise.all([
        Word.find({
          languageId: user.nativeLanguageId,
        }).distinct("_id"),
        Word.find({
          languageId,
        }).distinct("_id"),
      ]);
      const card = await Card.findOne({
        _id: id,
        wordId: { $in: nativeWordIds },
        translationId: { $in: translationWordIds },
      }).populate("categoryId");
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      let isCorrect;
      let correctTranslation;
      if (type === "flash") {
        correctTranslation = (await Word.findById(card.wordId).lean()).text;
        isCorrect =
          answer.trim().toLowerCase() ===
          correctTranslation.trim().toLowerCase();
      } else {
        correctTranslation = (await Word.findById(card.translationId).lean())
          .text;
        isCorrect =
          answer.trim().toLowerCase() ===
          correctTranslation.trim().toLowerCase();
      }
      const finalQuality = isCorrect ? 5 : 0;

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
      const attemptScore = (finalQuality / 5) * scorePerCard;

      let attempt = await Attempt.findOne({ attemptId, userId: req.userId });
      if (!attempt) {
        attempt = await Attempt.create({
          attemptId: attemptId || new mongoose.Types.ObjectId().toString(),
          userId: req.userId,
          languageId,
          categoryId: card.categoryId._id,
          type,
          date: new Date(),
          score: attemptScore,
          correctAnswers: finalQuality === 5 ? 1 : 0,
          totalAnswers: 1,
        });
      } else {
        attempt.score += attemptScore;
        attempt.correctAnswers += finalQuality === 5 ? 1 : 0;
        attempt.totalAnswers += 1;
        await attempt.save();
      }

      if (!progress) {
        progress = await UserProgress.create({
          userId: req.userId,
          languageId,
          categoryId: card.categoryId._id,
          totalCards,
          maxScore: attempt.score,
          unlocked: card.categoryId.order === 1,
        });
      } else if (attempt.score > progress.maxScore) {
        progress.maxScore = attempt.score;
        await progress.save();
      }

      const nextCategory = await Category.findOne({
        order: card.categoryId.order + 1,
        languageId: card.categoryId.languageId,
      }).lean();
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
            { userId: req.userId, languageId, categoryId: nextCategory._id },
            { $set: { unlocked: true } },
            { new: true }
          );
        }
      }

      if (attempt && attempt.categoryId) {
        await attempt.populate([
          { path: "userId", select: "username avatar" },
          { path: "languageId", select: "name" },
          { path: "categoryId", select: "name order requiredScore" },
        ]);
      }
      const response = {
        attempt: {
          attemptId: attempt.attemptId,
          user: attempt.userId,
          language: attempt.languageId,
          category: attempt.categoryId,
          type: attempt.type,
          date: attempt.date,
          score: attempt.score,
          correctAnswers: attempt.correctAnswers,
          totalAnswers: attempt.totalAnswers,
        },
        isCorrect: isCorrect,
        correctTranslation: correctTranslation,
        quality: finalQuality,
      };
      res.json(response);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to submit card: ${error.message}` });
    }
  },

  async updateCard(req, res) {
    try {
      const { wordId, translationId, categoryId, example } = req.body;
      const card = await Card.findById(req.params.id);
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
      if (wordId) {
        const word = await Word.findById(wordId).lean();
        if (!word) {
          return res.status(404).json({ error: "Original word not found" });
        }
      }
      if (translationId) {
        const translation = await Word.findById(translationId).lean();
        if (!translation) {
          return res.status(404).json({ error: "Translation word not found" });
        }
      }
      if (categoryId) {
        const category = await Category.findById(categoryId).lean();
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
      }

      const oldCategoryId = card.categoryId;
      const oldTranslation = await Word.findById(card.translationId).lean();
      const updateData = {};
      if (wordId) updateData.wordId = wordId;
      if (translationId) updateData.translationId = translationId;
      if (categoryId) updateData.categoryId = categoryId;
      if (example !== undefined) updateData.example = example;
      Object.assign(card, updateData);
      await card.save();

      if (categoryId && !oldCategoryId.equals(categoryId)) {
        const translation = translationId
          ? await Word.findById(translationId).lean()
          : oldTranslation;
        const users = await User.find({
          learningLanguagesIds: translation.languageId,
        }).lean();
        if (users.length > 0) {
          await UserProgress.updateMany(
            {
              userId: { $in: users.map((u) => u._id) },
              languageId: translation.languageId,
              categoryId: oldCategoryId,
            },
            { $inc: { totalCards: -1 } }
          );
          await UserProgress.updateMany(
            {
              userId: { $in: users.map((u) => u._id) },
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
      }

      await card.populate([
        { path: "wordId", select: "text" },
        { path: "translationId", select: "text" },
        { path: "categoryId", select: "name" },
      ]);
      res.json(card);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to update card: ${error.message}` });
    }
  },

  async deleteCard(req, res) {
    try {
      const card = await Card.findById(req.params.id);
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      const translation = await Word.findById(card.translationId).lean();
      const users = await User.find({
        learningLanguagesIds: translation.languageId,
      }).lean();
      if (users.length > 0) {
        await UserProgress.updateMany(
          {
            userId: { $in: users.map((u) => u._id) },
            languageId: translation.languageId,
            categoryId: card.categoryId,
          },
          { $inc: { totalCards: -1 } }
        );
      }

      await card.deleteOne();
      res.json({ message: "Card deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to delete card: ${error.message}` });
    }
  },
};

module.exports = cardController;
