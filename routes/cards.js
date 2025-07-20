const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Word = require("../models/Word");
const Card = require("../models/Card");
const User = require('../models/User');
const { authenticate, authorizeRoles } = require("../middleware/auth");

// GET /api/cards
router.get("/", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate(
      "nativeLanguageId learningLanguagesIds"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const query =
      req.userRole === "admin"
        ? {}
        : {
            $and: [
              {
                wordId: {
                  $in: await Word.find({
                    languageId: user.nativeLanguageId._id,
                  }).distinct("_id"),
                },
              },
              {
                translationId: {
                  $in: await Word.find({
                    languageId: {
                      $in: user.learningLanguagesIds.map((lang) => lang._id),
                    },
                  }).distinct("_id"),
                },
              },
            ],
          };
    const cards = await Card.find(query)
      .populate("wordId", "text languageId categoryId meaning")
      .populate("translationId", "text languageId categoryId meaning");
    res.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ error: `Failed to fetch cards: ${error.message}` });
  }
});

// GET /api/cards/review
router.get(
  "/review",
  authenticate,
  authorizeRoles(["user"]),
  async (req, res) => {
    try {
      const user = await User.findById(req.userId).populate(
        "nativeLanguageId learningLanguagesIds"
      );
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.learningLanguagesIds?.length) {
        return res
          .status(400)
          .json({ error: "User must have at least one learning language" });
      }
      const cards = await Card.find({
        $and: [
          { nextReview: { $lte: new Date() } },
          {
            wordId: {
              $in: await Word.find({
                languageId: user.nativeLanguageId._id,
              }).distinct("_id"),
            },
          },
          {
            translationId: {
              $in: await Word.find({
                languageId: user.learningLanguagesIds[0]._id,
              }).distinct("_id"),
            },
          },
        ],
      })
        .populate("wordId", "text languageId meaning categoryId")
        .populate("translationId", "text languageId meaning categoryId");
      res.json(cards);
    } catch (error) {
      console.error("Error fetching review cards:", error);
      res
        .status(500)
        .json({ error: `Failed to fetch review cards: ${error.message}` });
    }
  }
);

// POST /api/cards
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const { wordId, translationId } = req.body;
      if (!wordId || !translationId) {
        return res
          .status(400)
          .json({ error: "Word and translation are required" });
      }
      if (!mongoose.Types.ObjectId.isValid(wordId)) {
        return res.status(400).json({ error: "Invalid original word ID" });
      }
      const word = await Word.findById(wordId);
      if (!word) {
        return res.status(404).json({ error: "Original word not found" });
      }
      if (!mongoose.Types.ObjectId.isValid(translationId)) {
        return res.status(400).json({ error: "Invalid translation word ID" });
      }
      const translationWord = await Word.findById(translationId);
      if (!translationWord) {
        return res.status(404).json({ error: "Translation word not found" });
      }
      const card = new Card({
        wordId,
        translationId,
      });
      await card.save();
      res.status(201).json(card);
    } catch (error) {
      console.error("Error creating card:", error);
      res
        .status(400)
        .json({ error: `Failed to create card: ${error.message}` });
    }
  }
);

// PUT /api/cards/:id/review
router.put(
  "/:id/review",
  authenticate,
  authorizeRoles(["user"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }
      const { quality } = req.body;
      if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
        res
          .status(400)
          .json({ error: "Quality must be an integer between 0 and 5" });
      }
      const user = await User.findById(req.userId).populate(
        "nativeLanguageId learningLanguagesIds"
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.learningLanguagesIds?.length) {
        return res
          .status(400)
          .json({ error: "User must have at least one learning language" });
      }
      const card = await Card.findOne({
        _id: req.params.id,
        $and: [
          {
            wordId: {
              $in: await Word.find({
                languageId: user.nativeLanguageId._id,
              }).distinct("_id"),
            },
          },
          {
            translationId: {
              $in: await Word.find({
                languageId: user.learningLanguagesIds[0]._id,
              }).distinct("_id"),
            },
          },
        ],
      });
      if (!card) return res.status(404).json({ error: "Card not found" });
      let { easiness, interval, repetitions } = card;
      repetitions += 1;
      easiness = Math.max(
        1.3,
        easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
      );
      if (quality < 3) {
        interval = 1;
      } else {
        if (repetitions === 1) interval = 1;
        else if (repetitions === 2) interval = 6;
        else interval = Math.round(interval * easiness);
      }
      const lastReviewed = new Date();
      const nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
      const updateCard = await Card.findOneAndUpdate(
        { _id: req.params.id },
        { interval, nextReview, easiness, repetitions, lastReviewed },
        { new: true }
      );
      res.json(updateCard);
    } catch (error) {
      console.error("Error reviewing card:", error);
      res
        .status(400)
        .json({ error: `Failed to review card: ${error.message}` });
    }
  }
);

// PUT /api/cards/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }
      const { wordId, translationId } = req.body;
      if (!wordId || !translationId) {
        return res
          .status(400)
          .json({ error: "Word and translation are required" });
      }
      if (!mongoose.Types.ObjectId.isValid(wordId)) {
        return res.status(400).json({ error: "Invalid original word ID" });
      }
      const word = await Word.findById(wordId);
      if (!word) {
        return res.status(404).json({ error: "Original word not found" });
      }
      if (!mongoose.Types.ObjectId.isValid(translationId)) {
        return res.status(400).json({ error: "Invalid translation word ID" });
      }
      const translationWord = await Word.findById(translationId);
      if (!translationWord) {
        return res.status(404).json({ error: "Translation word not found" });
      }
      const updateData = { wordId, translationId };
      const card = await Card.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );
      if (!card) return res.status(404).json({ error: "Card not found" });
      res.json(card);
    } catch (error) {
      console.error("Error updating card:", error);
      res
        .status(400)
        .json({ error: `Failed to update card: ${error.message}` });
    }
  }
);

// DELETE /api/cards/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }
      const card = await Card.findOneAndDelete({ _id: req.params.id });
      if (!card) return res.status(404).json({ error: "Card not found" });
      res.json({ message: "Card deleted" });
    } catch (error) {
      console.error("Error deleting card:", error);
      res
        .status(400)
        .json({ error: `Failed to delete card: ${error.message}` });
    }
  }
);

module.exports = router;