import {
  CardDTO,
  CardFiltersDTO,
  CreateCardDTO,
  ReviewCardsFiltersDTO,
  SubmitCardDTO,
  SubmitCardResponse,
  TestCardDTO,
  UpdateCardDTO,
} from "./card.dto";
import { v4 as uuidv4 } from "uuid";
import Attempt from "../attempt/Attempt";
import User from "../user/User";
import Module from "../module/Module";
import Word from "../word/Word";
import Card from "../card/Card";
import Language from "../language/Language";
import Level from "../level/Level";
import LevelProgress from "../language-progress/LevelProgress";
import ModuleProgress from "../language-progress/ModuleProgress";
import { ICardPopulated } from "./card.interface";
import { IAttemptPopulated } from "../attempt/attempt.interface";
import { ILevelProgressPopulated } from "../language-progress/level-progress.interface";

interface CardQuery {
  wordId?: unknown;
  translationId?: unknown;
  moduleId?: unknown;
  example?: unknown;
}

interface ProgressQuery {
  userId: string;
  languageId?: string;
  unlocked: boolean;
  moduleId?: string;
}

export class CardService {
  static async getCards(
    userId: string,
    userRole: string,
    data: CardFiltersDTO
  ): Promise<{ cards: CardDTO[]; total: number }> {
    const { moduleId, example, limit = 20, skip = 0 } = data;
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error("User not found");
    }
    if (moduleId) {
      const module = await Module.findById(moduleId).lean();
      if (!module) {
        throw new Error("Module not found");
      }
    }

    const query: CardQuery = {};
    if (userRole !== "admin") {
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

    const [cardsRaw, total] = await Promise.all([
      Card.find(query)
        .populate("wordId", "text languageId")
        .populate("translationId", "text languageId")
        .populate("moduleId", "name order")
        .skip(skip)
        .limit(limit)
        .lean<ICardPopulated[]>(),
      Card.countDocuments(query),
    ]);
    const cards: CardDTO[] = cardsRaw.map((c) => ({
      id: c._id.toString(),
      word: {
        id: c.wordId._id.toString(),
        text: c.wordId.text,
        languageId: c.wordId.languageId.toString(),
      },
      translation: {
        id: c.translationId._id.toString(),
        text: c.translationId.text,
        languageId: c.translationId.languageId.toString(),
      },
      module: {
        id: c.moduleId._id.toString(),
        name: c.moduleId.name,
        order: c.moduleId.order,
        requiredScore: c.moduleId.requiredScore,
      },
      ...(c.example !== undefined && { example: c.example }),
    }));
    return { cards, total };
  }

  static async getReviewCards(
    userId: string,
    data: ReviewCardsFiltersDTO
  ): Promise<{ cards: CardDTO[]; attemptId: string }> {
    const { languageId, moduleId } = data;
    const [user, language, module] = await Promise.all([
      User.findById(userId),
      Language.findById(languageId).lean(),
      moduleId ? Module.findById(moduleId).lean() : null,
    ]);
    if (!user) {
      throw new Error("User not found");
    }
    if (!language) {
      throw new Error("Language not found");
    }
    if (
      !(user.nativeLanguageId && user.nativeLanguageId.equals(languageId)) &&
      !(user.learningLanguagesIds ?? []).some(
        (id) => id && id.equals(languageId)
      )
    ) {
      throw new Error("Access to this language is restricted");
    }
    if (moduleId) {
      if (!module) {
        throw new Error("Module not found");
      }
      const progress = await ModuleProgress.findOne({
        userId,
        languageId,
        moduleId,
      }).lean();
      if (!progress?.unlocked) {
        throw new Error("Module is locked");
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

    const progressQuery: ProgressQuery = {
      userId,
      unlocked: true,
    };
    if (languageId) progressQuery.languageId = languageId;
    if (moduleId) progressQuery.moduleId = moduleId;
    const unlockedModules = await ModuleProgress.find(progressQuery).distinct(
      "moduleId"
    );

    const query = {
      wordId: { $in: nativeWordIds },
      translationId: { $in: translatedWordIds },
      moduleId: { $in: unlockedModules },
    };

    const cardsRaw = await Card.find(query)
      .populate({ path: "wordId", select: "text languageId" })
      .populate({ path: "translationId", select: "text languageId" })
      .populate({ path: "moduleId", select: "name order requiredScore" })
      .lean<ICardPopulated[]>();
    const cards: CardDTO[] = cardsRaw.map((c) => ({
      id: c._id.toString(),
      word: {
        id: c.wordId._id.toString(),
        text: c.wordId.text,
        languageId: c.wordId.languageId.toString(),
      },
      translation: {
        id: c.translationId._id.toString(),
        text: c.translationId.text,
        languageId: c.translationId.languageId.toString(),
      },
      module: {
        id: c.moduleId._id.toString(),
        name: c.moduleId.name,
        order: c.moduleId.order,
        requiredScore: c.moduleId.requiredScore,
      },
      ...(c.example !== undefined && { example: c.example }),
    }));
    const attemptId = uuidv4();
    return { cards, attemptId };
  }

  static async getTestCards(
    userId: string,
    data: ReviewCardsFiltersDTO
  ): Promise<{ cards: TestCardDTO[]; attemptId: string }> {
    const { languageId, moduleId } = data;
    const [user, language, module] = await Promise.all([
      User.findById(userId),
      Language.findById(languageId).lean(),
      moduleId ? Module.findById(moduleId).lean() : null,
    ]);
    if (!user) {
      throw new Error("User not found");
    }
    if (!language) {
      throw new Error("Language not found");
    }
    if (
      !(user.nativeLanguageId && user.nativeLanguageId.equals(languageId)) &&
      !(user.learningLanguagesIds ?? []).some(
        (id) => id && id.equals(languageId)
      )
    ) {
      throw new Error("Access to this language is restricted");
    }
    if (moduleId) {
      if (!module) {
        throw new Error("Module not found");
      }
      const progress = await ModuleProgress.findOne({
        userId: userId,
        languageId,
        moduleId,
      }).lean();
      if (!progress?.unlocked) {
        throw new Error("Module is locked");
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
    const progressQuery: ProgressQuery = {
      userId,
      unlocked: true,
    };
    if (languageId) progressQuery.languageId = languageId;
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
      .lean<ICardPopulated[]>();

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
        id: card._id.toString(),
        word: {
          id: card.wordId._id.toString(),
          text: card.wordId.text,
          languageId: card.wordId.languageId.toString(),
        },
        module: {
          id: card.moduleId._id.toString(),
          name: card.moduleId.name,
          order: card.moduleId.order,
          requiredScore: card.moduleId.requiredScore,
        },
        ...(card.example !== undefined && { example: card.example }),
        options,
      };
    });
    const attemptId = uuidv4();
    return { cards: testCards, attemptId };
  }

  static async createCard(data: CreateCardDTO): Promise<CardDTO> {
    const { wordId, translationId, moduleId, example } = data;
    const [word, translation, module] = await Promise.all([
      Word.findById(wordId).lean(),
      Word.findById(translationId).lean(),
      Module.findById(moduleId).lean(),
    ]);
    if (!word) {
      throw new Error("Original word not found");
    }
    if (!translation) {
      throw new Error("Translation word not found");
    }
    if (!module) {
      throw new Error("Module not found");
    }

    const saved = await new Card({
      wordId,
      translationId,
      moduleId,
      example,
    }).save();
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
    const populated = await Card.findById(saved._id)
      .populate({ path: "wordId", select: "text languageId" })
      .populate({ path: "translationId", select: "text languageId" })
      .populate({ path: "moduleId", select: "name order requiredScore" })
      .lean<ICardPopulated>();
    if (!populated) {
      throw new Error("Failed to populate module after save");
    }
    const cardDTO: CardDTO = {
      id: populated._id.toString(),
      word: {
        id: populated.wordId._id.toString(),
        text: populated.wordId.text,
        languageId: populated.wordId.languageId.toString(),
      },
      translation: {
        id: populated.translationId._id.toString(),
        text: populated.translationId.text,
        languageId: populated.translationId.languageId.toString(),
      },
      module: {
        id: populated.moduleId._id.toString(),
        name: populated.moduleId.name,
        order: populated.moduleId.order,
        requiredScore: populated.moduleId.requiredScore,
      },
      ...(populated.example !== undefined && { example: populated.example }),
    };
    return cardDTO;
  }

  static async submitCard(
    userId: string,
    cardId: string,
    data: SubmitCardDTO
  ): Promise<SubmitCardResponse> {
    const { languageId, answer, attemptId, type, levelId } = data;
    const [user, language, level] = await Promise.all([
      User.findById(userId),
      Language.findById(languageId).lean(),
      Level.findById(levelId).lean(),
    ]);

    if (!user) {
      throw new Error("User not found");
    }
    if (!user.learningLanguagesIds?.length) {
      throw new Error("User must have at least one learning language");
    }
    if (!language) {
      throw new Error("Language not found");
    }
    if (
      !(user.nativeLanguageId && user.nativeLanguageId.equals(languageId)) &&
      !(user.learningLanguagesIds ?? []).some(
        (id) => id && id.equals(languageId)
      )
    ) {
      throw new Error("Access to this language is restricted");
    }
    if (!level) {
      throw new Error("Level not found");
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
      _id: cardId,
      wordId: { $in: nativeWordIds },
      translationId: { $in: translationWordIds },
      moduleId: level.moduleId,
    })
      .populate("moduleId")
      .lean<ICardPopulated>();
    if (!card) {
      throw new Error("Card not found");
    }

    let isCorrect;
    let correctTranslation;
    if (type === "flash") {
      const wordDoc = await Word.findById(card.wordId).lean<{
        text: string;
      } | null>();
      if (!wordDoc) {
        throw new Error("Word not found");
      }
      correctTranslation = wordDoc.text;
      isCorrect =
        answer?.trim().toLowerCase() ===
        correctTranslation.trim().toLowerCase();
    } else {
      const wordDoc = await Word.findById(card.translationId).lean<{
        text: string;
      } | null>();
      if (!wordDoc) {
        throw new Error("Word not found");
      }
      correctTranslation = wordDoc.text;
      isCorrect =
        answer?.trim().toLowerCase() ===
        correctTranslation.trim().toLowerCase();
    }
    const finalQuality = isCorrect ? 5 : 0;

    const totalCards = await Card.countDocuments({
      moduleId: card.moduleId._id,
      translationId: { $in: translationWordIds },
    });
    const scorePerCard = totalCards > 0 ? 100 / totalCards : 0;
    const attemptScore = (finalQuality / 5) * scorePerCard;

    let attempt = await Attempt.findOne({ attemptId, userId });
    if (!attempt) {
      attempt = await Attempt.create({
        attemptId: attemptId,
        userId,
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
      userId,
      languageId,
      moduleId: card.moduleId._id,
      levelId,
    });

    if (!levelProgress) {
      levelProgress = await LevelProgress.create({
        userId,
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
      userId,
      languageId,
      moduleId: card.moduleId._id,
    })
      .populate("levelId")
      .lean<ILevelProgressPopulated[]>();

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
      { userId, languageId, moduleId: card.moduleId._id },
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
            userId,
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
          userId,
          languageId,
          moduleId: nextModule._id,
        });

        if (!nextModuleProgress) {
          nextModuleProgress = await ModuleProgress.create({
            userId,
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
              userId,
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
            userId,
            languageId,
            moduleId: nextModule._id,
          });

          if (existingLevels === 0) {
            const levels = await Level.find({ moduleId: nextModule._id })
              .sort({ order: 1 })
              .lean();

            for (const level of levels) {
              await LevelProgress.create({
                userId,
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

    const populatedAttempt = await Attempt.findById(attempt._id)
      .populate([
        { path: "userId", select: "username avatar" },
        { path: "languageId", select: "name" },
        { path: "moduleId", select: "name order requiredScore" },
        { path: "levelId", select: "order tasks requiredScore" },
      ])
      .lean<IAttemptPopulated>();
    if (!populatedAttempt) {
      throw new Error("Attempt not found after update");
    }
    return {
      attempt: {
        id: populatedAttempt._id.toString(),
        user: {
          id: populatedAttempt.userId._id.toString(),
          username: populatedAttempt.userId.username,
          avatar: populatedAttempt.userId.avatar,
        },
        language: {
          id: populatedAttempt.languageId._id.toString(),
          name: populatedAttempt.languageId.name,
        },
        module: {
          id: populatedAttempt.moduleId._id.toString(),
          name: populatedAttempt.moduleId.name,
          order: populatedAttempt.moduleId.order,
        },
        level: {
          id: populatedAttempt.levelId._id.toString(),
          order: populatedAttempt.levelId.order,
          tasks: populatedAttempt.levelId.tasks,
        },
        type: populatedAttempt.type,
        date: populatedAttempt.date.toISOString(),
        score: populatedAttempt.score,
        correctAnswers: populatedAttempt.correctAnswers,
        totalAnswers: populatedAttempt.totalAnswers,
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
    };
  }

  static async updateCard(
    cardId: string,
    data: UpdateCardDTO
  ): Promise<CardDTO> {
    const { wordId, translationId, moduleId, example } = data;
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error("Card not found");
    }
    if (wordId) {
      const word = await Word.findById(wordId).lean();
      if (!word) {
        throw new Error("Original word not found");
      }
    }
    if (translationId) {
      const translation = await Word.findById(translationId).lean();
      if (!translation) {
        throw new Error("Translation word not found");
      }
    }
    if (moduleId) {
      const module = await Module.findById(moduleId).lean();
      if (!module) {
        throw new Error("Module not found");
      }
    }

    const oldModuleId = card.moduleId;
    const oldTranslation = await Word.findById(card.translationId).lean();
    const updateData: Partial<UpdateCardDTO> = {};
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
      if (!translation) {
        throw new Error("Translation word not found");
      }
      const users = await User.find({
        learningLanguagesIds: translation.languageId,
      }).lean();
      if (users.length > 0) {
        await ModuleProgress.updateMany(
          {
            userId: { $in: users.map((u) => u._id) },
            languageId: translation.languageId,
            moduleId: oldModuleId,
          },
          {}
        );
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

    const populated = await Card.findById(card._id)
      .populate([
        { path: "wordId", select: "text languageId" },
        { path: "translationId", select: "text languageId" },
        { path: "moduleId", select: "name order requiredScore" },
      ])
      .lean<ICardPopulated>();
    if (!populated) {
      throw new Error("Card not found after update");
    }
    const cardDTO: CardDTO = {
      id: populated._id.toString(),
      word: {
        id: populated.wordId._id.toString(),
        text: populated.wordId.text,
        languageId: populated.wordId.languageId.toString(),
      },
      translation: {
        id: populated.translationId._id.toString(),
        text: populated.translationId.text,
        languageId: populated.translationId.languageId.toString(),
      },
      module: {
        id: populated.moduleId._id.toString(),
        name: populated.moduleId.name,
        order: populated.moduleId.order,
        requiredScore: populated.moduleId.requiredScore,
      },
      ...(populated.example !== undefined && { example: populated.example }),
    };
    return cardDTO;
  }

  static async deleteCard(cardId: string): Promise<void> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error("Card not found");
    }
    const translation = await Word.findById(card.translationId).lean();
    if (!translation) {
      throw new Error("Translation word not found");
    }
    const users = await User.find({
      learningLanguagesIds: translation.languageId,
    }).lean();
    if (users.length > 0) {
      await ModuleProgress.updateMany(
        {
          userId: { $in: users.map((u) => u._id) },
          languageId: translation.languageId,
          moduleId: card.moduleId,
        },
        {}
      );
    }
    await card.deleteOne();
  }
}
