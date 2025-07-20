const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/User");
const Word = require("../models/Word");
const Card = require("../models/Card");
const Language = require("../models/Language");
const { authenticate, authorizeRoles } = require("../middleware/auth");

// GET /api/languages
router.get("/", authenticate, async (req, res) => {
  try {
    const languages = await Language.find();
    res.json(languages);
  } catch (error) {
    console.error("Error fetching languages", error);
    res
      .status(500)
      .json({ error: `Failed to fetch languages: ${error.message}` });
  }
});

// POST /api/languages
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const { code, name } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: "Code and name are required" });
      }
      const language = new Language({ code, name });
      await language.save();
      res.status(201).json(language);
    } catch (error) {
      console.error("Error creating language", error);
      res
        .status(400)
        .json({ error: `Failed to create language: ${error.message}` });
    }
  }
);

// PUT /api/languages/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid language ID" });
      }
      const { code, name } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: "Code and name are required" });
      }
      const updateData = { code, name };
      const language = await Language.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
        { new: true, runValidators: true }
      );
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      res.json(language);
    } catch (error) {
      console.error("Error updating language", error);
      res
        .status(400)
        .json({ error: `Failed to update language: ${error.message}` });
    }
  }
);

// DELETE /api/languages/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid language id" });
      }
      const language = await Language.findOneAndDelete({ _id: req.params.id });
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      await Card.deleteMany({
        $or: [
          {
            wordId: {
              $in: await Word.find({ languageId: req.params.id }).distinct(
                "_id"
              ),
            },
          },
          {
            translationId: {
              $in: await Word.find({ languageId: req.params.id }).distinct(
                "_id"
              ),
            },
          },
        ],
      });
      await Word.deleteMany({ languageId: req.params.id });
      await User.updateMany(
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
      );
      res.json({
        message:
          "Language deleted, related users updated, related words and cards removed",
      });
    } catch (error) {
      console.error("Error deleting language", error);
      res
        .status(400)
        .json({ error: `Failed to delete language: ${error.message}` });
    }
  }
);

module.exports = router;