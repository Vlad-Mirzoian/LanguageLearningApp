const Card = require("../models/Card");
const Language = require("../models/Language");
const User = require("../models/User");
const Word = require("../models/Word");

const wordController = {
  async getWords(req, res) {
    try {
      const { languageId, text, limit = 20, skip = 0 } = req.query;
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (languageId) {
        const language = await Language.findById(languageId).lean();
        if (!language) {
          return res.status(404).json({ error: "Language not found" });
        }
        if (req.userRole !== "admin") {
          if (
            !user.nativeLanguageId.equals(languageId) &&
            !user.learningLanguagesIds.some((id) => id.equals(languageId))
          ) {
            return res
              .status(403)
              .json({ error: "Access to this language is restricted" });
          }
        }
      }

      const query = {};
      if (req.userRole !== "admin") {
        const allowedLanguagesIds = [
          user.nativeLanguageId,
          ...user.learningLanguagesIds,
        ];
        query.languageId = { $in: allowedLanguagesIds };
      }
      if (languageId) query.languageId = languageId;
      if (text) query.text = { $regex: text, $options: "i" };

      const [words, total] = await Promise.all([
        Word.find(query)
          .populate("languageId", "code name")
          .skip(skip)
          .limit(limit)
          .lean(),
        Word.countDocuments(query),
      ]);
      
      res.json({words, total});
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch words: ${error.message}` });
    }
  },

  async createWord(req, res) {
    try {
      const { text, languageId } = req.body;
      const language = await Language.findById(languageId).lean();
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      const existingWord = await Word.findOne({ text, languageId }).lean();
      if (existingWord) {
        return res
          .status(400)
          .json({ error: "Word already exists for this language" });
      }
      const word = new Word({ text, languageId });
      await word.save();
      await word.populate("languageId", "name");
      res.status(201).json(word);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to create word: ${error.message}` });
    }
  },

  async checkUnique(req, res) {
    try {
      const { text, languageId } = req.query;
      const language = await Language.findById(languageId).lean();
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      const existingWord = await Word.findOne({ text, languageId }).lean();
      if (existingWord) {
        return res
          .status(400)
          .json({ error: "Word already exists for this language" });
      }
      res.json({ isUnique: true });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to check word uniqueness: ${error.message}` });
    }
  },

  async updateWord(req, res) {
    try {
      const { text, languageId } = req.body;
      if (text && languageId) {
        const language = await Language.findById(languageId).lean();
        if (!language) {
          return res.status(404).json({ error: "Language not found" });
        }
        const existingWord = await Word.findOne({
          text,
          languageId,
          _id: { $ne: req.params.id },
        }).lean();
        if (existingWord) {
          return res
            .status(400)
            .json({ error: "Word already exists for this language" });
        }
      } else if (languageId) {
        const language = await Language.findById(languageId).lean();
        if (!language) {
          return res.status(404).json({ error: "Language not found" });
        }
      }

      const updateData = {};
      if (text) updateData.text = text;
      if (languageId) updateData.languageId = languageId;
      const word = await Word.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
        { new: true, runValidators: true }
      );
      if (!word) {
        return res.status(404).json({ error: "Word not found" });
      }
      await word.populate("languageId", "name");
      res.json(word);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to update word: ${error.message}` });
    }
  },

  async deleteWord(req, res) {
    try {
      const word = await Word.findOneAndDelete({ _id: req.params.id }).lean();
      if (!word) {
        return res.status(404).json({ error: "Word not found" });
      }

      await Card.deleteMany({
        $or: [{ wordId: req.params.id }, { translationId: req.params.id }],
      });
      res.json({ message: "Word and related cards deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to delete word: ${error.message}` });
    }
  },
};

module.exports = wordController;
