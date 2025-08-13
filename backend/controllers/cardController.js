const mongoose = require("mongoose");
const User = require("../models/User");
const Category = require("../models/Category");
const Word = require("../models/Word");
const Card = require("../models/Card");
const Language = require("../models/Language");
const UserProgress = require("../models/UserProgress");

const cardController = {
  async getCards(req, res) {
    try {
      const { categoryId, meaning, limit = 20, skip = 0 } = req.query;
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
      if (meaning) query.meaning = { $regex: meaning, $options: "i" };

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

      if (categoryId) {
        const category = await Category.findById(categoryId).lean();
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

      const learningLanguages = user.learningLanguagesIds;
      if (!Array.isArray(learningLanguages) || learningLanguages.length === 0) {
        return res
          .status(400)
          .json({ error: "User must have at least one learning language" });
      }

      const nativeWordIds = await Word.find({
        languageId: user.nativeLanguageId,
      }).distinct("_id");
      const translatedWordIds = await Word.find({
        languageId,
      }).distinct("_id");
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
      if (categoryId) query.categoryId = categoryId;

      const cards = await Card.find(query)
        .populate({ path: "wordId", select: "text languageId" })
        .populate({ path: "translationId", select: "text languageId" })
        .populate({ path: "categoryId", select: "name order requiredScore" })
        .lean();

      let attemptId = null;
      if (categoryId) {
        attemptId = new mongoose.Types.ObjectId().toString();
        await UserProgress.findOneAndUpdate(
          { userId: req.userId, languageId, categoryId },
          { $set: { score: 0, attemptId } },
          { new: true }
        );
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

      if (categoryId) {
        const category = await Category.findById(categoryId).lean();
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

      const learningLanguages = user.learningLanguagesIds;
      if (!Array.isArray(learningLanguages) || learningLanguages.length === 0) {
        return res
          .status(400)
          .json({ error: "User must have at least one learning language" });
      }

      const nativeWordIds = await Word.find({
        languageId: user.nativeLanguageId,
      }).distinct("_id");
      const translatedWordIds = await Word.find({
        languageId,
      }).distinct("_id");
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
      if (categoryId) query.categoryId = categoryId;

      const cards = await Card.find(query)
        .populate({ path: "wordId", select: "text languageId" })
        .populate({ path: "translationId", select: "text languageId" })
        .populate({ path: "categoryId", select: "name order requiredScore" })
        .lean();

      const testCards = await Promise.all(
        cards.map(async (card) => {
          const correctTranslation = card.translationId.text;
          const otherTranslations = await Word.find({
            languageId,
            _id: { $ne: card.translationId },
          })
            .limit(3)
            .select("text")
            .lean();
          const options = [
            { text: correctTranslation, isCorrect: true },
            ...otherTranslations.map((t) => ({
              text: t.text,
              isCorrect: false,
            })),
          ].sort(() => Math.random() - 0.5);

          return {
            _id: card._id,
            word: card.wordId,
            category: card.categoryId,
            options,
          };
        })
      );

      const totalCards = await Card.countDocuments(query);
      let attemptId = null;
      if (categoryId) {
        attemptId = new mongoose.Types.ObjectId().toString();
        await UserProgress.findOneAndUpdate(
          { userId: req.userId, languageId, categoryId },
          { $set: { score: 0, attemptId } },
          { new: true }
        );
      }

      res.json({ cards: testCards, attemptId, total: totalCards });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch test cards: ${error.message}` });
    }
  },

  async createCard(req, res) {
    try {
      const { wordId, translationId, categoryId, meaning } = req.body;
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

      const card = new Card({ wordId, translationId, categoryId, meaning });
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

  async reviewCard(req, res) {
    try {
      const { id } = req.params;
      const { languageId, quality, attemptId } = req.body;
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.learningLanguagesIds?.length) {
        return res
          .status(400)
          .json({ error: "User must have at least one learning language" });
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

      const nativeWordIds = await Word.find({
        languageId: user.nativeLanguageId,
      }).distinct("_id");
      const translationWordIds = await Word.find({
        languageId,
      }).distinct("_id");
      const card = await Card.findOne({
        _id: id,
        wordId: { $in: nativeWordIds },
        translationId: { $in: translationWordIds },
      }).populate("categoryId");
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

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
      res
        .status(500)
        .json({ error: `Failed to review card: ${error.message}` });
    }
  },

  async submitAnswer(req, res) {
    try {
      const { id } = req.params;
      const { languageId, answer, attemptId } = req.body;
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.learningLanguagesIds?.length) {
        return res
          .status(400)
          .json({ error: "User must have at least one learning language" });
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

      const nativeWordIds = await Word.find({
        languageId: user.nativeLanguageId,
      }).distinct("_id");
      const translationWordIds = await Word.find({
        languageId,
      }).distinct("_id");
      const card = await Card.findOne({
        _id: id,
        wordId: { $in: nativeWordIds },
        translationId: { $in: translationWordIds },
      }).populate("categoryId");
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      const correctTranslation = (
        await Word.findById(card.translationId).lean()
      ).text;
      const isCorrect =
        answer.trim().toLowerCase() === correctTranslation.trim().toLowerCase();
      const quality = isCorrect ? 5 : 0;

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

      res.json({
        isCorrect,
        correctTranslation,
        quality,
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
      res
        .status(500)
        .json({ error: `Failed to check user answer: ${error.message}` });
    }
  },

  async updateCard(req, res) {
    try {
      const { wordId, translationId, categoryId, meaning } = req.body;
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
      if (meaning !== undefined) updateData.meaning = meaning;
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
