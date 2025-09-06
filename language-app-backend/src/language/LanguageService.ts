import {
  CreateLanguageDTO,
  LanguageDTO,
  UpdateLanguageDTO,
} from "./language.dto";
import Language from "./Language";
import User from "../user/User";
import Card from "../card/Card";
import Word from "../word/Word";
import { ILanguage } from "./language.interface";

export class LanguageService {
  static async getLanguages(): Promise<LanguageDTO[]> {
    const languages = await Language.find().lean<ILanguage[]>();
    return languages.map((lang) => ({
      id: lang._id.toString(),
      code: lang.code,
      name: lang.name,
    }));
  }

  static async createLanguage(data: CreateLanguageDTO): Promise<LanguageDTO> {
    const { code, name } = data;
    const existingLanguage = await Language.findOne({ code }).lean<ILanguage>();
    if (existingLanguage) {
      throw new Error("Language code already exists");
    }
    const language = new Language({ code, name });
    const saved = await language.save();
    return {
      id: saved._id.toString(),
      code: saved.code,
      name: saved.name,
    };
  }

  static async updateLanguage(
    languageId: string,
    data: UpdateLanguageDTO
  ): Promise<LanguageDTO> {
    const { code, name } = data;
    if (code) {
      const existingLanguage = await Language.findOne({
        code,
        _id: { $ne: languageId },
      }).lean();
      if (existingLanguage) {
        throw new Error("Language code already exists");
      }
    }

    const updateData: Partial<UpdateLanguageDTO> = {};
    if (code) updateData.code = code;
    if (name) updateData.name = name;

    const language = await Language.findOneAndUpdate(
      { _id: languageId },
      updateData,
      { new: true, runValidators: true, lean: true }
    );
    if (!language) {
      throw new Error("Language not found");
    }
    return {
      id: language._id.toString(),
      code: language.code,
      name: language.name,
    };
  }

  static async deleteLanguage(languageId: string): Promise<void> {
    const language = await Language.findOneAndDelete({
      _id: languageId,
    }).lean();
    if (!language) {
      throw new Error("Language not found");
    }
    const wordIds = await Word.find({ languageId: languageId })
      .distinct("_id")
      .lean();
    await Promise.all([
      Card.deleteMany({
        $or: [
          { wordId: { $in: wordIds } },
          { translationId: { $in: wordIds } },
        ],
      }),
      Word.deleteMany({ languageId: languageId }),
      User.updateMany(
        {
          $or: [
            { nativeLanguageId: languageId },
            { learningLanguagesIds: languageId },
          ],
        },
        {
          $set: { nativeLanguageId: null },
          $pull: { learningLanguagesIds: languageId },
        }
      ),
    ]);
  }
}
