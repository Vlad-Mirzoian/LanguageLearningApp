import {
  CheckWordUniqueDTO,
  CreateWordDTO,
  UpdateWordDTO,
  WordFullDTO,
  WordFiltersDTO,
} from "./word.dto";
import Language from "../language/Language";
import Word from "../word/Word";
import Card from "../card/Card";
import { IWordPopulated } from "./word.interface";

export class WordService {
  static async getWords(
    data: WordFiltersDTO
  ): Promise<{ words: WordFullDTO[]; total: number }> {
    const { languageId, text, limit = 20, skip = 0 } = data;
    if (languageId) {
      const language = await Language.findById(languageId).lean();
      if (!language) {
        throw new Error("Language not found");
      }
    }
    const query = {
      ...(languageId && { languageId }),
      ...(text && { text: { $regex: text, $options: "i" } }),
    };
    const [wordsRaw, total] = await Promise.all([
      Word.find(query)
        .populate("languageId", "code name")
        .skip(skip)
        .limit(limit)
        .lean<IWordPopulated[]>(),
      Word.countDocuments(query),
    ]);
    const words: WordFullDTO[] = wordsRaw.map((w) => ({
      id: w._id.toString(),
      text: w.text,
      language: {
        id: w.languageId._id.toString(),
        name: w.languageId.name,
        code: w.languageId.code,
      },
      ...(w.example !== undefined && { example: w.example }),
    }));
    return { words, total };
  }

  static async createWord(data: CreateWordDTO): Promise<WordFullDTO> {
    const { text, languageId, example } = data;
    const language = await Language.findById(languageId).lean();
    if (!language) {
      throw new Error("Language not found");
    }
    const existingWord = await Word.findOne({ text, languageId }).lean();
    if (existingWord) {
      throw new Error("Word already exists for this language");
    }
    const saved = await new Word({ text, languageId, example }).save();
    const populated = await Word.findById(saved._id)
      .populate({ path: "languageId", select: "name code" })
      .lean<IWordPopulated>();
    if (!populated) {
      throw new Error("Failed to populate module after save");
    }
    const wordDTO: WordFullDTO = {
      id: populated._id.toString(),
      text: populated.text,
      language: {
        id: populated.languageId._id.toString(),
        name: populated.languageId.name,
        code: populated.languageId.code,
      },
      ...(populated.example !== undefined && { example: populated.example }),
    };
    return wordDTO;
  }

  static async checkUnique(
    data: CheckWordUniqueDTO
  ): Promise<{ isUnique: boolean }> {
    const { text, languageId } = data;
    const language = await Language.findById(languageId).lean();
    if (!language) {
      throw new Error("Language not found");
    }
    const existingWord = await Word.findOne({ text, languageId }).lean();
    if (existingWord) {
      throw new Error("Word already exists for this language");
    }
    return { isUnique: true };
  }

  static async updateWord(
    wordId: string,
    data: UpdateWordDTO
  ): Promise<WordFullDTO> {
    const { text, languageId, example } = data;
    if (text && languageId) {
      const language = await Language.findById(languageId).lean();
      if (!language) {
        throw new Error("Language not found");
      }
      const existingWord = await Word.findOne({
        text,
        languageId,
        _id: { $ne: wordId },
      }).lean();
      if (existingWord) {
        throw new Error("Word already exists for this language");
      }
    } else if (languageId) {
      const language = await Language.findById(languageId).lean();
      if (!language) {
        throw new Error("Language not found");
      }
    }
    const updateData: Partial<UpdateWordDTO> = {};
    if (text) updateData.text = text;
    if (languageId) updateData.languageId = languageId;
    if (example !== undefined) updateData.example = example;

    const word = await Word.findOneAndUpdate({ _id: wordId }, updateData, {
      new: true,
      runValidators: true,
    })
      .populate({ path: "languageId", select: "name code" })
      .lean<IWordPopulated>();
    if (!word) {
      throw new Error("Word not found");
    }
    const wordDTO: WordFullDTO = {
      id: word._id.toString(),
      text: word.text,
      language: {
        id: word.languageId._id.toString(),
        name: word.languageId.name,
        code: word.languageId.code,
      },
      ...(word.example !== undefined && { example: word.example }),
    };
    return wordDTO;
  }

  static async deleteWord(wordId: string): Promise<void> {
    const word = await Word.findOneAndDelete({ _id: wordId }).lean();
    if (!word) {
      throw new Error("Word not found");
    }
    await Card.deleteMany({
      $or: [{ firstWordId: wordId }, { secondWordId: wordId }],
    });
  }
}
