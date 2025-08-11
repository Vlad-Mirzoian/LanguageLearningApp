const Language = require("../models/Language");
const User = require("../models/User");
const Card = require("../models/Card");
const Word = require("../models/Word");

const languageController = {
  async getLanguages(req, res) {
    try {
      const languages = await Language.find().lean();
      res.json(languages);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch languages: ${error.message}` });
    }
  },

  async createLanguage(req, res) {
    try {
      const { code, name } = req.body;
      const existingLanguage = await Language.findOne({ code }).lean();
      if (existingLanguage) {
        return res.status(400).json({ error: "Language code already exists" });
      }
      const language = new Language({ code, name });
      await language.save();
      res.status(201).json(language);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to create language: ${error.message}` });
    }
  },

  async updateLanguage(req, res) {
    try {
      const { code, name } = req.body;
      if (code) {
        const existingLanguage = await Language.findOne({
          code,
          _id: { $ne: req.params.id },
        }).lean();
        if (existingLanguage) {
          return res
            .status(400)
            .json({ error: "Language code already exists" });
        }
      }

      const updateData = {};
      if (code) updateData.code = code;
      if (name) updateData.name = name;
      const language = await Language.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
        { new: true, runValidators: true, lean: true }
      );
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      res.json(language);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to update language: ${error.message}` });
    }
  },

  async deleteLanguage(req, res) {
    try {
      const language = await Language.findOneAndDelete({
        _id: req.params.id,
      }).lean();
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      const wordIds = await Word.find({ languageId: req.params.id })
        .distinct("_id")
        .lean();
      await Promise.all([
        Card.deleteMany({
          $or: [
            { wordId: { $in: wordIds } },
            { translationId: { $in: wordIds } },
          ],
        }),
        Word.deleteMany({ languageId: req.params.id }),
        User.updateMany(
          {
            $or: [
              { nativeLanguageId: req.params.id },
              { learningLanguagesIds: req.params.id },
            ],
          },
          {
            $set: { nativeLanguageId: null },
            $pull: { learningLanguagesIds: req.params.id },
          }
        ),
      ]);
      res.json({ message: "Language deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to delete language: ${error.message}` });
    }
  },
};

module.exports = languageController;
