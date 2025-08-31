const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Attempt = require("../models/Attempt");
const User = require("../models/User");
const Module = require("../models/Module");
const Word = require("../models/Word");
const Card = require("../models/Card");
const ModuleProgress = require("../models/ModuleProgress");
const Language = require("../models/Language");
const Level = require("../models/Level");
const LevelProgress = require("../models/LevelProgress");

const cardController = {
  async getCards(req, res) {
    try {
      const { moduleId, example, limit = 20, skip = 0 } = req.query;
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (moduleId) {
        const module = await Module.findById(moduleId).lean();
        if (!module) {
          return res.status(404).json({ error: "Module not found" });
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

      if (moduleId) query.moduleId = moduleId;
      if (example) query.example = { $regex: example, $options: "i" };

      const [cards, total] = await Promise.all([
        Card.find(query)
          .populate("wordId", "text languageId")
          .populate("translationId", "text languageId")
          .populate("moduleId", "name")
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
      const { languageId, moduleId } = req.query;
      const [user, language, module] = await Promise.all([
        User.findById(req.userId),
        Language.findById(languageId).lean(),
        moduleId ? Module.findById(moduleId).lean() : null,
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
      if (moduleId) {
        if (!module) {
          return res.status(404).json({ error: "Module not found" });
        }
        const progress = await ModuleProgress.findOne({
          userId: req.userId,
          languageId,
          moduleId,
        }).lean();
        if (!progress?.unlocked) {
          return res.status(403).json({ error: "Module is locked" });
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
      if (moduleId) progressQuery.moduleId = moduleId;
      const unlockedModules = await ModuleProgress.find(progressQuery).distinct(
        "moduleId"
      );

      const query = {
        wordId: { $in: nativeWordIds },
        translationId: { $in: translatedWordIds },
        moduleId: { $in: unlockedModules },
      };

      const cards = await Card.find(query)
        .populate({ path: "wordId", select: "text languageId" })
        .populate({ path: "translationId", select: "text languageId" })
        .populate({ path: "moduleId", select: "name order requiredScore" })
        .lean();
      let attemptId = null;
      if (moduleId) {
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
      const { languageId, moduleId } = req.query;
      const [user, language, module] = await Promise.all([
        User.findById(req.userId),
        Language.findById(languageId).lean(),
        moduleId ? Module.findById(moduleId).lean() : null,
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
      if (moduleId) {
        if (!module) {
          return res.status(404).json({ error: "Module not found" });
        }
        const progress = await ModuleProgress.findOne({
          userId: req.userId,
          languageId,
          moduleId,
        }).lean();
        if (!progress?.unlocked) {
          return res.status(403).json({ error: "Module is locked" });
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
      if (moduleId) progressQuery.moduleId = moduleId;
      const unlockedModules = await ModuleProgress.find(progressQuery).distinct(
        "moduleId"
      );

      const query = {
        wordId: { $in: nativeWordIds },
        translationId: { $in: translatedWordIds },
        moduleId: { $in: unlockedModules },
      };

      const cards = await Card.find(query)
        .populate({ path: "wordId", select: "text languageId" })
        .populate({ path: "translationId", select: "text languageId" })
        .populate({ path: "moduleId", select: "name order requiredScore" })
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
          module: card.moduleId,
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
      const { wordId, translationId, moduleId, example } = req.body;
      const [word, translation, module] = await Promise.all([
        Word.findById(wordId).lean(),
        Word.findById(translationId).lean(),
        Module.findById(moduleId).lean(),
      ]);
      if (!word) {
        return res.status(404).json({ error: "Original word not found" });
      }
      if (!translation) {
        return res.status(404).json({ error: "Translation word not found" });
      }
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      const card = new Card({ wordId, translationId, moduleId, example });
      await card.save();

      const users = await User.find({
        learningLanguagesIds: translation.languageId,
      }).lean();
      if (users.length > 0) {
        await ModuleProgress.updateMany(
          {
            userId: { $in: users.map((u) => u._id) },
            languageId: translation.languageId,
            moduleId,
          },
          {
            $setOnInsert: {
              bestScore: 0,
              unlocked: false,
              completedLevels: 0,
              achievements: [],
            },
          },
          { upsert: true }
        );
      }

      await card.populate([
        { path: "wordId", select: "text" },
        { path: "translationId", select: "text" },
        { path: "moduleId", select: "name" },
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
      const { languageId, answer, attemptId, type, levelId } = req.body;
      const [user, language, level] = await Promise.all([
        User.findById(req.userId),
        Language.findById(languageId).lean(),
        Level.findById(levelId).lean(),
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
      if (!level) {
        return res.status(404).json({ error: "Level not found" });
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
        moduleId: level.moduleId,
      }).populate("moduleId");
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

      const totalCards = await Card.countDocuments({
        moduleId: card.moduleId._id,
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
          moduleId: card.moduleId._id,
          levelId,
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

      let levelProgress = await LevelProgress.findOne({
        userId: req.userId,
        languageId,
        moduleId: card.moduleId._id,
        levelId,
      });

      if (!levelProgress) {
        levelProgress = await LevelProgress.create({
          userId: req.userId,
          languageId,
          moduleId: card.moduleId._id,
          levelId,
          bestScore: attempt.score,
          unlocked: level.order === 1 && card.moduleId.order === 1,
        });
      } else if (attempt.score > levelProgress.bestScore) {
        levelProgress.bestScore = attempt.score;
        await levelProgress.save();
      }

      const levelCompleted = levelProgress.bestScore >= level.requiredScore;
      if (levelCompleted && !levelProgress.unlocked) {
        levelProgress.unlocked = true;
        await levelProgress.save();
      }

      const allLevels = await LevelProgress.find({
        userId: req.userId,
        languageId,
        moduleId: card.moduleId._id,
      }).populate({ path: "levelId", select: "requiredScore" });

      const totalLevelsCount = await Level.countDocuments({
        moduleId: card.moduleId._id,
      });

      const completedLevels = allLevels.filter(
        (lp) => lp.bestScore >= lp.levelId.requiredScore
      ).length;

      const moduleTotalPoints =
        (allLevels.reduce((sum, lp) => {
          const levelPercent = Math.min(
            (lp.bestScore / lp.levelId.requiredScore) * 100,
            100
          );
          return sum + levelPercent;
        }, 0) /
          (totalLevelsCount * 100)) *
        100;

      const moduleProgress = await ModuleProgress.findOneAndUpdate(
        { userId: req.userId, languageId, moduleId: card.moduleId._id },
        {
          $set: {
            totalLevels: totalLevelsCount,
            completedLevels,
            totalScore: moduleTotalPoints,
          },
          $setOnInsert: {
            unlocked: card.moduleId.order === 1,
            achievements: [],
          },
        },
        { new: true, upsert: true }
      );

      if (levelCompleted) {
        const nextLevel = await Level.findOne({
          moduleId: card.moduleId._id,
          order: level.order + 1,
        }).lean();

        if (nextLevel) {
          await LevelProgress.findOneAndUpdate(
            {
              userId: req.userId,
              languageId,
              moduleId: card.moduleId._id,
              levelId: nextLevel._id,
            },
            { $set: { unlocked: true } },
            { upsert: true, new: true }
          );
        }
      }

      if (moduleProgress.totalScore >= card.moduleId.requiredScore) {
        const nextModule = await Module.findOne({
          languageId,
          order: card.moduleId.order + 1,
        }).lean();

        if (nextModule) {
          let nextModuleProgress = await ModuleProgress.findOne({
            userId: req.userId,
            languageId,
            moduleId: nextModule._id,
          });

          if (!nextModuleProgress) {
            nextModuleProgress = await ModuleProgress.create({
              userId: req.userId,
              languageId,
              moduleId: nextModule._id,
              totalLevels: await Level.countDocuments({
                moduleId: nextModule._id,
              }),
              completedLevels: 0,
              totalScore: 0,
              unlocked: true,
              achievements: [],
            });

            const levels = await Level.find({ moduleId: nextModule._id })
              .sort({ order: 1 })
              .lean();

            for (const level of levels) {
              await LevelProgress.create({
                userId: req.userId,
                languageId,
                moduleId: nextModule._id,
                levelId: level._id,
                bestScore: 0,
                unlocked: level.order === 1,
              });
            }
          } else if (!nextModuleProgress.unlocked) {
            nextModuleProgress.unlocked = true;
            await nextModuleProgress.save();

            const existingLevels = await LevelProgress.countDocuments({
              userId: req.userId,
              languageId,
              moduleId: nextModule._id,
            });

            if (existingLevels === 0) {
              const levels = await Level.find({ moduleId: nextModule._id })
                .sort({ order: 1 })
                .lean();

              for (const level of levels) {
                await LevelProgress.create({
                  userId: req.userId,
                  languageId,
                  moduleId: nextModule._id,
                  levelId: level._id,
                  bestScore: 0,
                  unlocked: level.order === 1,
                });
              }
            }
          }
        }
      }

      await attempt.populate([
        { path: "userId", select: "username avatar" },
        { path: "languageId", select: "name" },
        { path: "moduleId", select: "name order requiredScore" },
        { path: "levelId", select: "order tasks requiredScore" },
      ]);

      res.json({
        attempt: {
          attemptId: attempt.attemptId,
          user: attempt.userId,
          language: attempt.languageId,
          module: attempt.moduleId,
          level: attempt.levelId,
          type: attempt.type,
          date: attempt.date,
          score: attempt.score,
          correctAnswers: attempt.correctAnswers,
          totalAnswers: attempt.totalAnswers,
        },
        isCorrect,
        correctTranslation,
        quality: finalQuality,
        levelCompleted,
        levelScore: levelProgress.bestScore,
        moduleProgress: {
          completedLevels: moduleProgress.completedLevels,
          totalScore: moduleProgress.totalScore,
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to submit card: ${error.message}` });
    }
  },

  async updateCard(req, res) {
    try {
      const { wordId, translationId, moduleId, example } = req.body;
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
      if (moduleId) {
        const module = await Module.findById(moduleId).lean();
        if (!module) {
          return res.status(404).json({ error: "Module not found" });
        }
      }

      const oldModuleId = card.moduleId;
      const oldTranslation = await Word.findById(card.translationId).lean();
      const updateData = {};
      if (wordId) updateData.wordId = wordId;
      if (translationId) updateData.translationId = translationId;
      if (moduleId) updateData.moduleId = moduleId;
      if (example !== undefined) updateData.example = example;
      Object.assign(card, updateData);
      await card.save();

      if (moduleId && !oldModuleId.equals(moduleId)) {
        const translation = translationId
          ? await Word.findById(translationId).lean()
          : oldTranslation;
        const users = await User.find({
          learningLanguagesIds: translation.languageId,
        }).lean();
        if (users.length > 0) {
          await ModuleProgress.updateMany({
            userId: { $in: users.map((u) => u._id) },
            languageId: translation.languageId,
            moduleId: oldModuleId,
          });
          await ModuleProgress.updateMany(
            {
              userId: { $in: users.map((u) => u._id) },
              languageId: translation.languageId,
              moduleId,
            },
            {
              $setOnInsert: {
                bestScore: 0,
                unlocked: false,
                completedLevels: 0,
                achievements: [],
              },
            },
            { upsert: true }
          );
        }
      }

      await card.populate([
        { path: "wordId", select: "text" },
        { path: "translationId", select: "text" },
        { path: "moduleId", select: "name" },
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
        await ModuleProgress.updateMany({
          userId: { $in: users.map((u) => u._id) },
          languageId: translation.languageId,
          moduleId: card.moduleId,
        });
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
