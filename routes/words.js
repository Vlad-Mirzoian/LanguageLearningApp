const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Word = require("../models/Word");
const Language = require("../models/Language");
const Category = require('../models/Category');
const Card = require("../models/Card");
const User = require('../models/User');
const { authenticate, authorizeRoles } = require("../middleware/auth");

// GET /api/words
router.get("/", authenticate, async (req, res) => {
  try {
    const { languageId, categoryId } = req.query;
    const user = await User.findById(req.userId).populate(
      "nativeLanguageId learningLanguagesIds"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const query = {};
    if (req.userRole !== "admin") {
      const allowedLanguagesIds = [
        user.nativeLanguageId._id,
        ...user.learningLanguagesIds.map((lang) => lang._id),
      ];
      query.languageId = { $in: allowedLanguagesIds };
    }
    if (languageId) {
      if (!mongoose.Types.ObjectId.isValid(languageId)) {
        return res.status(400).json({ error: "Invalid language ID" });
      }
      const language = await Language.findById(languageId);
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      if (
        req.userRole !== "admin" &&
        !query.languageId.$in.includes(languageId)
      ) {
        return res
          .status(403)
          .json({ error: "Access to this language is restricted" });
      }
      query.languageId = languageId;
    }
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      query.categoryId = categoryId;
    }
    const words = await Word.find(query)
      .populate("languageId", "code name")
      .populate("categoryId", "name");
    res.json(words);
  } catch (error) {
    console.error("Error fetching words", error);
    res.status(500).json({ error: `Failed to fetch words: ${error.message}` });
  }
});

// POST /api/words
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const { text, languageId, categoryId, meaning } = req.body;
      if (!text || !languageId) {
        return res
          .status(400)
          .json({ error: "Text and language are required" });
      }
      if (!mongoose.Types.ObjectId.isValid(languageId)) {
        return res.status(400).json({ error: "Invalid language ID" });
      }
      const language = await Language.findById(languageId);
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      if (categoryId) {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
          return res.status(400).json({ error: "Invalid category ID" });
        }
        const category = await Category.findById(categoryId);
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
      }
      const word = new Word({
        text,
        languageId,
        categoryId,
        meaning,
      });
      await word.save();
      res.status(201).json(word);
    } catch (error) {
      console.error("Error creating word", error);
      res
        .status(400)
        .json({ error: `Failed to create word: ${error.message}` });
    }
  }
);

// PUT /api/words/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid word ID" });
      }
      const { text, languageId, categoryId, meaning } = req.body;
      if (!text || !languageId) {
        return res
          .status(400)
          .json({ error: "Text and language are required" });
      }
      if (!mongoose.Types.ObjectId.isValid(languageId)) {
        return res.status(400).json({ error: "Invalid language ID" });
      }
      const language = await Language.findById(languageId);
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      const updateData = { text, languageId };
      if (categoryId) {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
          return res.status(400).json({ error: "Invalid category ID" });
        }
        const category = await Category.findById(categoryId);
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
        updateData.categoryId = categoryId;
      }
      if (meaning !== undefined) updateData.meaning = meaning;
      const word = await Word.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );
      if (!word) return res.status(404).json({ error: "Word not found" });
      res.json(word);
    } catch (error) {
      console.error("Error updating word", error);
      res
        .status(400)
        .json({ error: `Failed to update word: ${error.message}` });
    }
  }
);

// DELETE /api/words/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid word ID" });
      }
      const word = await Word.findOneAndDelete({ _id: req.params.id });
      if (!word) return res.status(404).json({ error: "Word not found" });
      await Card.deleteMany({
        $or: [{ wordId: req.params.id }, { translationId: req.params.id }],
      });
      res.json({ message: "Word and related cards deleted" });
    } catch (error) {
      console.error("Error deleting word", error);
      res
        .status(400)
        .json({ error: `Failed to delete word: ${error.message}` });
    }
  }
);

module.exports = router;