const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Word = require("../models/Word");
const Card = require("../models/Card");
const User = require("../models/User");
const Language = require("../models/Language");
const Category = require("../models/Category");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { body, param, query } = require("express-validator");

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
      .populate("wordId", "text languageId")
      .populate("translationId", "text languageId")
      .populate("categoryId", "name");
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
  [
    query("languageId")
      .optional()
      .isMongoId()
      .withMessage("Invalid language ID")
      .custom(async (value, { req }) => {
        if (!value) return true;
        const language = await Language.findById(value);
        if (!language) throw new Error("Language not found");
        const user = await User.findById(req.userId);
        if (
          !user.nativeLanguageId.equals(value) &&
          !user.learningLanguagesIds.some((id) => id.equals(value))
        ) {
          throw new Error("Access to this language is restricted");
        }
        return true;
      }),
    query("categoryId")
      .optional()
      .isMongoId()
      .withMessage("Invalid category ID")
      .custom(async (value) => {
        if (!value) return true;
        const category = await Category.findById(value);
        if (!category) throw new Error("Category not found");
        return true;
      }),
  ],
  validate,
  authorizeRoles(["user"]),
  async (req, res) => {
    try {
      const user = await User.findById(req.userId).populate(
        "nativeLanguageId learningLanguagesIds"
      );
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.learningLanguagesIds?.length) {
        return res
          .status(400)
          .json({ error: "User must have at least one learning language" });
      }
      const { languageId, categoryId } = req.query;
      const query = {
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
                languageId: languageId || user.learningLanguagesIds[0]._id,
              }).distinct("_id"),
            },
          },
          ...(categoryId ? [{ categoryId }] : []),
        ],
      };
      const cards = await Card.find(query)
        .populate({
          path: "wordId",
          select: "text languageId",
        })
        .populate({
          path: "translationId",
          select: "text languageId",
        })
        .populate({
          path: "categoryId",
          select: "name",
        });
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
  [
    body("wordId")
      .notEmpty()
      .withMessage("Original word is required")
      .isMongoId()
      .withMessage("Invalid word ID")
      .custom(async (value) => {
        const word = await Word.findById(value);
        if (!word) throw new Error("Original word not found");
        return true;
      }),
    body("translationId")
      .notEmpty()
      .withMessage("Translation word is required")
      .isMongoId()
      .withMessage("Invalid translation ID")
      .custom(async (value) => {
        const translation = await Word.findById(value);
        if (!translation) throw new Error("Translation word not found");
        return true;
      }),
    body("categoryId")
      .notEmpty()
      .withMessage("Category is required")
      .isMongoId()
      .withMessage("Invalid category ID")
      .custom(async (value) => {
        const category = await Category.findById(value);
        if (!category) throw new Error("Category not found");
        return true;
      }),
    body("meaning")
      .optional()
      .notEmpty()
      .withMessage("Meaning cannot be empty if provided")
      .trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { wordId, translationId, categoryId, meaning } = req.body;
      const card = new Card({ wordId, translationId, categoryId, meaning });
      await card.save();
      res.status(201).json(card);
    } catch (error) {
      console.error("Error creating card:", error);
      res
        .status(500)
        .json({ error: `Failed to create card: ${error.message}` });
    }
  }
);

// PUT /api/cards/:id/review
router.put(
  "/:id/review",
  authenticate,
  authorizeRoles(["user"]),
  [
    param("id").isMongoId().withMessage("Invalid card ID"),
    body("languageId")
      .notEmpty()
      .withMessage("Language are required")
      .isMongoId()
      .withMessage("Invalid language ID")
      .custom(async (value, { req }) => {
        const language = await Language.findById(value);
        if (!language) throw new Error("Language not found");
        const user = await User.findById(req.userId);
        if (
          !user.nativeLanguageId.equals(value) &&
          !user.learningLanguagesIds.some((id) => id.equals(value))
        ) {
          throw new Error("Access to this language is restricted");
        }
        return true;
      }),
    body("quality")
      .isInt({ min: 1, max: 5 })
      .withMessage("Quality must be an integer between 0 and 5"),
  ],
  validate,
  async (req, res) => {
    try {
      const { languageId, quality } = req.body;
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
                languageId: languageId,
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
        .status(500)
        .json({ error: `Failed to review card: ${error.message}` });
    }
  }
);

// PUT /api/cards/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  [
    param("id").isMongoId().withMessage("Invalid card ID"),
    body("wordId")
      .optional()
      .notEmpty()
      .withMessage("Original word is required")
      .isMongoId()
      .withMessage("Invalid word ID")
      .custom(async (value) => {
        const word = await Word.findById(value);
        if (!word) throw new Error("Original word not found");
        return true;
      }),
    body("translationId")
      .optional()
      .notEmpty()
      .withMessage("Translation word is required")
      .isMongoId()
      .withMessage("Invalid translation ID")
      .custom(async (value) => {
        const translation = await Word.findById(value);
        if (!translation) throw new Error("Translation word not found");
        return true;
      }),
    body("categoryId")
      .optional()
      .notEmpty()
      .withMessage("Category cannot be empty if provided")
      .isMongoId()
      .withMessage("Invalid category ID")
      .custom(async (value) => {
        const category = await Category.findById(value);
        if (!category) throw new Error("Category not found");
        return true;
      }),
    body("meaning")
      .optional()
      .notEmpty()
      .withMessage("Meaning cannot be empty if provided")
      .trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { wordId, translationId, categoryId, meaning } = req.body;
      const updateData = { wordId, translationId, categoryId };
      if (meaning !== undefined) updateData.meaning = meaning;
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
        .status(500)
        .json({ error: `Failed to update card: ${error.message}` });
    }
  }
);

// DELETE /api/cards/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [param("id").isMongoId().withMessage("Invalid card ID")],
  validate,
  async (req, res) => {
    try {
      const card = await Card.findOneAndDelete({ _id: req.params.id });
      if (!card) return res.status(404).json({ error: "Card not found" });
      res.json({ message: "Card deleted" });
    } catch (error) {
      console.error("Error deleting card:", error);
      res
        .status(500)
        .json({ error: `Failed to delete card: ${error.message}` });
    }
  }
);

module.exports = router;
