import {
  CardDTO,
  CardFiltersDTO,
  CreateCardDTO,
  ReviewCardDTO,
  ReviewCardsFiltersDTO,
  SubmitCardRequest,
  SubmitCardResponse,
  UpdateCardDTO,
} from "./card.dto";
import { v4 as uuidv4 } from "uuid";
import User from "../user/User";
import Module from "../module/Module";
import Word from "../word/Word";
import Card from "../card/Card";
import Language from "../language/Language";
import Level from "../level/Level";
import ModuleProgress from "../language-progress/ModuleProgress";
import { ICard, ICardPopulated } from "./card.interface";
import { AttemptService } from "../attempt/AttemptService";
import { LanguageProgressService } from "../language-progress/LanguageProgressService";
import { FilterQuery } from "mongoose";

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
    const { wordText, moduleName, limit = 20, skip = 0 } = data;
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error("User not found");
    }
    const query: FilterQuery<ICard> = {};
    if (wordText) {
      query.$or = [
        {
          firstWordId: {
            $in: await Word.find({
              text: { $regex: wordText, $options: "i" },
            }).select("_id"),
          },
        },
        {
          secondWordId: {
            $in: await Word.find({
              text: { $regex: wordText, $options: "i" },
            }).select("_id"),
          },
        },
      ];
    }
    if (moduleName) {
      const modules = await Module.find({
        name: { $regex: moduleName, $options: "i" },
      })
        .select("_id")
        .lean();
      if (modules.length === 0) {
        throw new Error("Module not found");
      }
      const moduleIds = modules.map((m) => m._id);
      query.moduleIds = { $in: moduleIds };
    }

    if (userRole !== "admin") {
      const nativeWordIds = await Word.find({
        languageId: user.nativeLanguageId,
      }).distinct("_id");
      const translationWordIds = await Word.find({
        languageId: { $in: user.learningLanguagesIds },
      }).distinct("_id");
      query.$or = [
        {
          firstWordId: { $in: nativeWordIds },
          secondWordId: { $in: translationWordIds },
        },
        {
          firstWordId: { $in: translationWordIds },
          secondWordId: { $in: nativeWordIds },
        },
      ];
    }

    const [cardsRaw, total] = await Promise.all([
      Card.find(query)
        .populate("firstWordId", "text languageId")
        .populate("secondWordId", "text languageId")
        .populate("moduleIds", "name order")
        .skip(skip)
        .limit(limit)
        .lean<ICardPopulated[]>(),
      Card.countDocuments(query),
    ]);
    const cards: CardDTO[] = cardsRaw.map((c) => ({
      id: c._id.toString(),
      firstWord: {
        id: c.firstWordId._id.toString(),
        text: c.firstWordId.text,
        languageId: c.firstWordId.languageId.toString(),
      },
      secondWord: {
        id: c.secondWordId._id.toString(),
        text: c.secondWordId.text,
        languageId: c.secondWordId.languageId.toString(),
      },
      modules: c.moduleIds.map((mod) => ({
        id: mod._id.toString(),
        name: mod.name,
        order: mod.order,
        requiredScore: mod.requiredScore,
      })),
    }));
    return { cards, total };
  }

  static async getReviewCards(
    userId: string,
    data: ReviewCardsFiltersDTO
  ): Promise<{ cards: ReviewCardDTO[]; attemptId: string }> {
    const { languageId, moduleId } = data;
    const [user, language, module] = await Promise.all([
      User.findById(userId),
      Language.findById(languageId).lean(),
      Module.findById(moduleId).lean(),
    ]);
    if (!user) {
      throw new Error("User not found");
    }
    if (!language) {
      throw new Error("Language not found");
    }
    if (!module) {
      throw new Error("Module not found");
    }
    if (
      !(
        user.nativeLanguageId &&
        user.nativeLanguageId.equals(user.nativeLanguageId)
      ) &&
      !(user.learningLanguagesIds ?? []).some(
        (id) => id && id.equals(user.nativeLanguageId)
      )
    ) {
      throw new Error("Access to this language is restricted");
    }
    const progress = await ModuleProgress.findOne({
      userId,
      languageId,
      moduleId,
    }).lean();
    if (!progress?.unlocked) {
      throw new Error("Module is locked");
    }

    const [nativeWordIds, learningWordIds] = await Promise.all([
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
      $or: [
        {
          firstWordId: { $in: nativeWordIds },
          secondWordId: { $in: learningWordIds },
        },
        {
          firstWordId: { $in: learningWordIds },
          secondWordId: { $in: nativeWordIds },
        },
      ],
      moduleIds: { $in: unlockedModules },
    };

    const cardsRaw = await Card.find(query)
      .populate({ path: "firstWordId", select: "text languageId example" })
      .populate({ path: "secondWordId", select: "text languageId example" })
      .populate({ path: "moduleIds", select: "name order requiredScore" })
      .lean<ICardPopulated[]>();

    const cards: ReviewCardDTO[] = await Promise.all(
      cardsRaw.map(async (c) => {
        const isNativeFirst =
          c.firstWordId.languageId.toString() ===
          user.nativeLanguageId?.toString();

        const translationWord = isNativeFirst ? c.firstWordId : c.secondWordId;
        const originalWord = isNativeFirst ? c.secondWordId : c.firstWordId;

        const selectedModule = c.moduleIds.find(
          (mod) => mod._id.toString() === moduleId?.toString()
        );
        if (!selectedModule)
          throw new Error(`Card ${c._id} does not contain the required module`);

        const allTranslations = await Word.find({
          languageId: originalWord.languageId,
        })
          .select("text")
          .lean();

        const otherOptions = allTranslations
          .filter((t) => t.text !== originalWord.text)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((t) => ({ text: t.text, isCorrect: false }));

        const options = [
          { text: originalWord.text, isCorrect: true },
          ...otherOptions,
        ].sort(() => Math.random() - 0.5);

        const card: ReviewCardDTO = {
          id: c._id.toString(),
          module: {
            id: selectedModule._id.toString(),
            name: selectedModule.name,
            order: selectedModule.order,
            requiredScore: selectedModule.requiredScore,
          },
          translation: {
            id: translationWord._id.toString(),
            text: translationWord.text,
            languageId: translationWord.languageId.toString(),
          },
          original: {
            id: originalWord._id.toString(),
            text: originalWord.text,
            languageId: originalWord.languageId.toString(),
          },
          example: originalWord.example,
          options
        };

        return card;
      })
    );
    const attemptId = uuidv4();
    return { cards, attemptId };
  }

  static async createCard(data: CreateCardDTO): Promise<CardDTO> {
    const { firstWordId, secondWordId, moduleIds } = data;
    if (firstWordId.toString() === secondWordId.toString()) {
      throw new Error(
        "Cannot create a card with the same word as original and translation"
      );
    }
    const [word, translation] = await Promise.all([
      Word.findById(firstWordId).lean(),
      Word.findById(secondWordId).lean(),
    ]);
    if (!word) {
      throw new Error("Original word not found");
    }
    if (!translation) {
      throw new Error("Translation word not found");
    }
    const modules = await Module.find({ _id: { $in: moduleIds } }).lean();
    if (modules.length !== moduleIds.length) {
      throw new Error("One or more modules not found");
    }

    const saved = await new Card({
      firstWordId,
      secondWordId,
      moduleIds,
    }).save();
    const users = await User.find({
      learningLanguagesIds: translation.languageId,
    }).lean();
    if (users.length > 0) {
      const bulkOps = [];
      for (const user of users) {
        for (const modId of moduleIds) {
          bulkOps.push({
            updateOne: {
              filter: {
                userId: user._id,
                languageId: translation.languageId,
                moduleId: modId,
              },
              update: {
                $setOnInsert: {
                  bestScore: 0,
                  unlocked: false,
                  completedLevels: 0,
                  achievements: [],
                },
              },
              upsert: true,
            },
          });
        }
      }
      if (bulkOps.length > 0) {
        await ModuleProgress.bulkWrite(bulkOps);
      }
    }
    const populated = await Card.findById(saved._id)
      .populate({ path: "firstWordId", select: "text languageId" })
      .populate({ path: "secondWordId", select: "text languageId" })
      .populate({ path: "moduleIds", select: "name order requiredScore" })
      .lean<ICardPopulated>();
    if (!populated) {
      throw new Error("Failed to populate module after save");
    }
    const cardDTO: CardDTO = {
      id: populated._id.toString(),
      firstWord: {
        id: populated.firstWordId._id.toString(),
        text: populated.firstWordId.text,
        languageId: populated.firstWordId.languageId.toString(),
      },
      secondWord: {
        id: populated.secondWordId._id.toString(),
        text: populated.secondWordId.text,
        languageId: populated.secondWordId.languageId.toString(),
      },
      modules: populated.moduleIds.map((mod) => ({
        id: mod._id.toString(),
        name: mod.name,
        order: mod.order,
        requiredScore: mod.requiredScore,
      })),
    };
    return cardDTO;
  }

  static async submitCard(
    userId: string,
    cardId: string,
    data: SubmitCardRequest
  ): Promise<SubmitCardResponse> {
    const { languageId, answer, attemptId, type, levelId } = data;
    const [user, learLanguage, level] = await Promise.all([
      User.findById(userId),
      Language.findById(languageId).lean(),
      Level.findById(levelId).lean(),
    ]);
    if (!user) {
      throw new Error("User not found");
    }
    if (!learLanguage) {
      throw new Error("Language not found");
    }
    if (!user.nativeLanguageId) {
      throw new Error("User has no native language set");
    }
    if (
      !(user.learningLanguagesIds ?? []).some((id) => id.equals(languageId))
    ) {
      throw new Error("Access to this learning language is restricted");
    }
    if (!level) {
      throw new Error("Level not found");
    }

    const [nativeWordIds, learningWordIds] = await Promise.all([
      Word.find({
        languageId: user.nativeLanguageId,
      }).distinct("_id"),
      Word.find({
        languageId: languageId,
      }).distinct("_id"),
    ]);
    const card = await Card.findOne({
      _id: cardId,
      $or: [
        {
          firstWordId: { $in: nativeWordIds },
          secondWordId: { $in: learningWordIds },
        },
        {
          firstWordId: { $in: learningWordIds },
          secondWordId: { $in: nativeWordIds },
        },
      ],
      moduleIds: level.moduleId,
    })
      .populate("moduleIds", "name order requiredScore")
      .lean<ICardPopulated>();
    if (!card) {
      throw new Error("Card not found");
    }
    const selectedModule = card.moduleIds.find(
      (mod) => mod._id.toString() === level.moduleId.toString()
    );
    if (!selectedModule) {
      throw new Error("Module not found in card");
    }

    const [firstWord, secondWord] = await Promise.all([
      Word.findById(card.firstWordId).lean(),
      Word.findById(card.secondWordId).lean(),
    ]);

    if (!firstWord || !secondWord) {
      throw new Error("Word not found in card");
    }

    const nativeWord = firstWord.languageId.equals(user.nativeLanguageId)
      ? firstWord
      : secondWord;
    const learningWord = firstWord.languageId.equals(languageId)
      ? firstWord
      : secondWord;

    let correctTranslation: string;

    if (type === "flash") {
      correctTranslation = nativeWord.text;
    } else {
      correctTranslation = learningWord.text;
    }

    const isCorrect =
      answer?.trim().toLowerCase() === correctTranslation.trim().toLowerCase();
    const finalQuality = isCorrect ? 5 : 0;

    const cardsRaw = await Card.find({
      $or: [
        {
          firstWordId: { $in: nativeWordIds },
          secondWordId: { $in: learningWordIds },
        },
        {
          firstWordId: { $in: learningWordIds },
          secondWordId: { $in: nativeWordIds },
        },
      ],
      moduleIds: { $in: [selectedModule._id] },
    }).lean();
    const totalCards = cardsRaw.length;
    const scorePerCard = totalCards > 0 ? 100 / totalCards : 0;
    const attemptScore = (finalQuality / 5) * scorePerCard;

    const attempt = await AttemptService.createOrUpdateAttempt({
      attemptId,
      userId,
      languageId,
      moduleId: selectedModule._id.toString(),
      levelId,
      type,
      score: attemptScore,
      isCorrect,
    });

    const { levelProgress, levelCompleted } =
      await LanguageProgressService.updateLevelProgress(
        userId,
        languageId,
        selectedModule._id.toString(),
        levelId,
        attempt.score,
        selectedModule.order
      );

    const moduleProgress = await LanguageProgressService.updateModuleProgress(
      userId,
      languageId,
      selectedModule._id.toString()
    );

    await LanguageProgressService.unlockNextLevelAndModule(
      userId,
      languageId,
      selectedModule._id.toString(),
      levelId,
      levelCompleted
    );

    return {
      attempt,
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
    const { firstWordId, secondWordId, moduleIds } = data;
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error("Card not found");
    }
    if (firstWordId) {
      const word = await Word.findById(firstWordId).lean();
      if (!word) {
        throw new Error("Original word not found");
      }
    }
    if (secondWordId) {
      const translation = await Word.findById(secondWordId).lean();
      if (!translation) {
        throw new Error("Translation word not found");
      }
    }
    if (
      (firstWordId ?? card.firstWordId.toString()) ===
      (secondWordId ?? card.secondWordId.toString())
    ) {
      throw new Error(
        "Cannot set the same word as both original and translation"
      );
    }
    if (moduleIds?.length) {
      const modules = await Module.find({ _id: { $in: moduleIds } }).lean();
      if (modules.length !== moduleIds.length) {
        throw new Error("Some modules not found");
      }
    }

    const updateData: Partial<UpdateCardDTO> = {};
    if (firstWordId) updateData.firstWordId = firstWordId;
    if (secondWordId) updateData.secondWordId = secondWordId;
    if (moduleIds) updateData.moduleIds = moduleIds;

    Object.assign(card, updateData);
    await card.save();

    const populated = await Card.findById(card._id)
      .populate([
        { path: "firstWordId", select: "text languageId" },
        { path: "secondWordId", select: "text languageId" },
        { path: "moduleIds", select: "name order requiredScore" },
      ])
      .lean<ICardPopulated>();
    if (!populated) {
      throw new Error("Card not found after update");
    }
    const cardDTO: CardDTO = {
      id: populated._id.toString(),
      firstWord: {
        id: populated.firstWordId._id.toString(),
        text: populated.firstWordId.text,
        languageId: populated.firstWordId.languageId.toString(),
      },
      secondWord: {
        id: populated.firstWordId._id.toString(),
        text: populated.firstWordId.text,
        languageId: populated.firstWordId.languageId.toString(),
      },
      modules: populated.moduleIds.map((mod) => ({
        id: mod._id.toString(),
        name: mod.name,
        order: mod.order,
        requiredScore: mod.requiredScore,
      })),
    };
    return cardDTO;
  }

  static async deleteCard(cardId: string): Promise<void> {
    const card = await Card.findById(cardId);
    if (!card) throw new Error("Card not found");
    await card.deleteOne();
  }
}
