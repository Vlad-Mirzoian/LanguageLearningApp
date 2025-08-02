const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Word = require("../models/Word");
const Language = require("../models/Language");
const Category = require("../models/Category");
const Card = require("../models/Card");
const User = require("../models/User");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { query, body, param } = require("express-validator");

// GET /api/words
router.get(
  "/",
  authenticate,
  [
    query("languageId")
      .optional()
      .isMongoId()
      .withMessage("Invalid language ID")
      .custom(async (value, { req }) => {
        if (!value) return true;
        const language = await Language.findById(value);
        if (!language) throw new Error("Language not found");
        if (req.userRole !== "admin") {
          const user = await User.findById(req.userId);
          if (
            !user.nativeLanguageId.equals(value) &&
            !user.learningLanguagesIds.some((id) => id.equals(value))
          ) {
            throw new Error("Access to this language is restricted");
          }
        }
        return true;
      }),
  ],
  validate,
  async (req, res) => {
    try {
      const { languageId } = req.query;
      const user = await User.findById(req.userId).populate(
        "nativeLanguageId learningLanguagesIds"
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      const query = {};
      if (req.userRole !== "admin") {
        const allowedLanguagesIds = [
          user.nativeLanguageId._id,
          ...user.learningLanguagesIds.map((lang) => lang._id),
        ];
        query.languageId = { $in: allowedLanguagesIds };
      }
      if (languageId) query.languageId = languageId;
      const words = await Word.find(query).populate("languageId", "code name");
      res.json(words);
    } catch (error) {
      console.error("Error fetching words", error);
      res
        .status(500)
        .json({ error: `Failed to fetch words: ${error.message}` });
    }
  }
);

// POST /api/words
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  [
    body("text").notEmpty().withMessage("Text are required").trim(),
    body("languageId")
      .notEmpty()
      .withMessage("Language are required")
      .isMongoId()
      .withMessage("Invalid language ID")
      .custom(async (value) => {
        const language = await Language.findById(value);
        if (!language) throw new Error("Language not found");
        return true;
      }),
  ],
  validate,
  async (req, res) => {
    try {
      const { text, languageId } = req.body;
      const word = new Word({
        text,
        languageId,
      });
      await word.save();
      await word.populate("languageId", "name");
      res.status(201).json(word);
    } catch (error) {
      console.error("Error creating word", error);
      res
        .status(500)
        .json({ error: `Failed to create word: ${error.message}` });
    }
  }
);

// GET /api/words/check-unique
router.get(
  "/check-unique",
  authenticate,
  authorizeRoles(["admin"]),
  [
    query("text").notEmpty().withMessage("Text are required").trim(),
    query("languageId")
      .notEmpty()
      .withMessage("Language are required")
      .isMongoId()
      .withMessage("Invalid language ID")
      .custom(async (value) => {
        const language = await Language.findById(value);
        if (!language) throw new Error("Language not found");
        return true;
      }),
  ],
  validate,
  async (req, res) => {
    const { text, languageId } = req.query;
    const existingWord = await Word.findOne({ text, languageId });
    if (existingWord) {
      return res
        .status(400)
        .json({ error: "Word already exists for this language" });
    }
    res.json({ isUnique: true });
    try {
    } catch (error) {
      console.error("Error checking uniqueness", error);
      res
        .status(500)
        .json({ error: `Failed to check word uniqueness: ${error.message}` });
    }
  }
);

// PUT /api/words/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid word ID"),
    body("text")
      .optional()
      .notEmpty()
      .withMessage("Text cannot be empty if provided")
      .trim(),
    body("languageId")
      .optional()
      .notEmpty()
      .withMessage("Language cannot be empty if provided")
      .isMongoId()
      .withMessage("Invalid language ID")
      .custom(async (value) => {
        const language = await Language.findById(value);
        if (!language) throw new Error("Language not found");
        return true;
      }),
  ],
  validate,
  async (req, res) => {
    try {
      const { text, languageId } = req.body;
      const updateData = { text, languageId };
      const word = await Word.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
        { new: true, runValidators: true }
      );
      if (!word) return res.status(404).json({ error: "Word not found" });
      await word.populate("languageId", "name");
      res.json(word);
    } catch (error) {
      console.error("Error updating word", error);
      res
        .status(500)
        .json({ error: `Failed to update word: ${error.message}` });
    }
  }
);

// DELETE /api/words/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [param("id").isMongoId().withMessage("Invalid word ID")],
  validate,
  async (req, res) => {
    try {
      const word = await Word.findOneAndDelete({ _id: req.params.id });
      if (!word) return res.status(404).json({ error: "Word not found" });
      await Card.deleteMany({
        $or: [{ wordId: req.params.id }, { translationId: req.params.id }],
      });
      res.json({ message: "Word and related cards deleted" });
    } catch (error) {
      console.error("Error deleting word", error);
      res
        .status(500)
        .json({ error: `Failed to delete word: ${error.message}` });
    }
  }
);

module.exports = router;
