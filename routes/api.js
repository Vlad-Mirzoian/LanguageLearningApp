const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Card = require("../models/Card");
const User = require("../models/User");
const Category = require("../models/Category");
const Word = require("../models/Word");
const Language = require("../models/Language");

// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const authorizeRoles = (role) => {
  return (req, res, next) => {
    if (!role.includes(req.userRole)) {
      return res
        .status(403)
        .json({ error: `Access restricted to role ${role}` });
    }
    next();
  };
};

// POST /api/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, nativeLanguageId, learningLanguagesIds } =
      req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    if (nativeLanguageId) {
      if (!mongoose.Types.ObjectId.isValid(nativeLanguageId)) {
        return res.status(400).json({ error: "Invalid nativeLanguageId" });
      }
      const nativeLang = await Language.findById(nativeLanguageId);
      if (!nativeLang)
        return res.status(404).json({ error: "Native language not found" });
    }
    if (learningLanguagesIds && !Array.isArray(learningLanguagesIds)) {
      return res
        .status(400)
        .json({ error: "LearningLanguagesIds must be an array" });
    }
    if (learningLanguagesIds?.length > 0) {
      for (const langId of learningLanguagesIds) {
        if (!mongoose.Types.ObjectId.isValid(langId)) {
          return res
            .status(400)
            .json({ error: `Invalid learning language ID: ${langId}` });
        }
        const lang = await Language.findById(langId);
        if (!lang)
          return res
            .status(404)
            .json({ error: `Learning language not found: ${langId}` });
      }
    }
    const hashed_password = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashed_password,
      nativeLanguageId,
      learningLanguagesIds,
    });
    await user.save();
    res.status(201).json({ message: "User created" });
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(400)
      .json({ error: `Failed to register user: ${error.message}` });
  }
});

// POST /api/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.json({
      token,
      user: {
        email: user.email,
        role: user.role,
        nativeLanguageId: user.nativeLanguageId,
        learningLanguagesIds: user.learningLanguagesIds,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(400).json({ error: `Failed to login user: ${error.message}` });
  }
});

// PUT /api/user
router.put("/user", authenticate, async (req, res) => {
  try {
    const { email, password, nativeLanguageId, learningLanguagesIds } =
      req.body;
    const updateData = {};
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.userId },
      });
      if (existingUser)
        return res.status(400).json({ error: "Email already exists" });
      updateData.email = email;
    }
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (nativeLanguageId) {
      if (!mongoose.Types.ObjectId.isValid(nativeLanguageId)) {
        return res.status(400).json({ error: "Invalid nativeLanguageId" });
      }
      const lang = await Language.findById(nativeLanguageId);
      if (!lang)
        return res.status(404).json({ error: "Native language not found" });
      updateData.nativeLanguageId = nativeLanguageId;
    } else if (nativeLanguageId === null) {
      updateData.nativeLanguageId = null;
    }
    if (learningLanguagesIds) {
      if (!Array.isArray(learningLanguagesIds)) {
        return res
          .status(400)
          .json({ error: "learningLanguages must be an array" });
      }
      for (const langId of learningLanguagesIds) {
        if (!mongoose.Types.ObjectId.isValid(langId)) {
          return res
            .status(400)
            .json({ error: `Invalid learningLanguage ID: ${langId}` });
        }
        const lang = await Language.findById(langId);
        if (!lang)
          return res
            .status(404)
            .json({ error: `Learning language not found: ${langId}` });
      }
      updateData.learningLanguagesIds = learningLanguagesIds;
    }
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    const user = await User.findOneAndUpdate({ _id: req.userId }, updateData, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      message: "User updated",
      user: {
        email: user.email,
        role: user.role,
        nativeLanguageId: user.nativeLanguageId,
        learningLanguagesIds: user.learningLanguagesIds,
      },
    });
  } catch (error) {
    console.error("Error updating user credentials:", error);
    res
      .status(400)
      .json({ error: `Failed to update user credentials: ${error.message}` });
  }
});

// DELETE /api/user
router.delete("/user", authenticate, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.userId,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    await Card.deleteMany({ userId: req.userId });
    res.json({ message: "User and associated cards deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(400).json({ error: `Failed to delete user: ${error.message}` });
  }
});

// GET /api/languages
router.get("/languages", authenticate, async (req, res) => {
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
  "/languages",
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
  "/languages/:id",
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
  "/languages/:id",
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

// GET /api/words
router.get("/words", authenticate, async (req, res) => {
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
  "/words",
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
  "/words/:id",
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
  "/words/:id",
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

// GET /api/categories
router.get("/categories", authenticate, async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories", error);
    res
      .status(500)
      .json({ error: `Failed to fetch categories: ${error.message}` });
  }
});

// POST /api/categories
router.post(
  "/categories",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const category = new Category({ name, description });
      await category.save();
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category", error);
      res
        .status(400)
        .json({ error: `Failed to create category: ${error.message}` });
    }
  }
);

// PUT /api/categories/:id
router.put(
  "/categories/:id",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const updateData = { name };
      if (description !== undefined) updateData.description = description;
      const category = await Category.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
        { new: true, runValidators: true }
      );
      if (!category)
        return res.status(404).json({ error: "Category not found" });
      res.json(category);
    } catch (error) {
      console.error("Error updating category", error);
      res
        .status(400)
        .json({ error: `Failed to update category: ${error.message}` });
    }
  }
);

//DELETE /api/categories/:id
router.delete(
  "/categories/:id",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const category = await Category.findOneAndDelete({
        _id: req.params.id,
      });
      if (!category)
        return res.status(404).json({ error: "Category not found" });
      await Word.updateMany(
        { categoryId: req.params.id },
        { $set: { categoryId: null } }
      );
      res.json({
        message: "Category deleted, related cards and words updated",
      });
    } catch (error) {
      console.error("Error deleting category", error);
      res
        .status(400)
        .json({ error: `Failed to delete category: ${error.message}` });
    }
  }
);

// GET /api/cards
router.get("/cards", authenticate, async (req, res) => {
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
  "/cards/review",
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
  "/cards",
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
  "/cards/:id/review",
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
  "/cards/:id",
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
  "/cards/:id",
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

/*
router.get('/progress', authenticate, authorizeRoles(['user']), async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('nativeLanguage learningLanguage');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Total cards
    const totalCards = await Card.countDocuments({ userId: req.userId });

    // Cards reviewed today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const reviewedToday = await Card.countDocuments({
      userId: req.userId,
      lastReviewed: { $gte: startOfDay },
    });

    // Learned cards (repetitions >= 5)
    const learnedCards = await Card.countDocuments({
      userId: req.userId,
      repetitions: { $gte: 5 },
    });

    // Cards by language
    const languageStats = await Card.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.userId) } },
      {
        $lookup: {
          from: 'words',
          localField: 'wordId',
          foreignField: '_id',
          as: 'word',
        },
      },
      { $unwind: '$word' },
      {
        $lookup: {
          from: 'words',
          localField: 'translationId',
          foreignField: '_id',
          as: 'translation',
        },
      },
      { $unwind: '$translation' },
      {
        $lookup: {
          from: 'languages',
          localField: 'word.languageId',
          foreignField: '_id',
          as: 'nativeLang',
        },
      },
      { $unwind: '$nativeLang' },
      {
        $lookup: {
          from: 'languages',
          localField: 'translation.languageId',
          foreignField: '_id',
          as: 'learningLang',
        },
      },
      { $unwind: '$learningLang' },
      {
        $group: {
          _id: {
            nativeLanguage: '$nativeLang._id',
            learningLanguage: '$learningLang._id',
          },
          nativeLanguageName: { $first: '$nativeLang.name' },
          learningLanguageName: { $first: '$learningLang.name' },
          total: { $sum: 1 },
          learned: { $sum: { $cond: [{ $gte: ['$repetitions', 5] }, 1, 0] } },
          avgEasiness: { $avg: '$easiness' },
          avgInterval: { $avg: '$interval' },
        },
      },
      {
        $project: {
          _id: 0,
          nativeLanguage: {
            id: '$_id.nativeLanguage',
            name: '$nativeLanguageName',
          },
          learningLanguage: {
            id: '$_id.learningLanguage',
            name: '$learningLanguageName',
          },
          total: 1,
          learned: 1,
          avgEasiness: { $round: ['$avgEasiness', 2] },
          avgInterval: { $round: ['$avgInterval', 2] },
        },
      },
    ]);

    // Category stats (based on Word.categoryId for wordId and translationId)
    const categoriesStats = await Card.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      {
        $lookup: {
          from: 'words',
          localField: 'wordId',
          foreignField: '_id',
          as: 'word',
        },
      },
      { $unwind: '$word' },
      {
        $lookup: {
          from: 'words',
          localField: 'translationId',
          foreignField: '_id',
          as: 'translation',
        },
      },
      { $unwind: '$translation' },
      {
        $lookup: {
          from: 'categories',
          localField: 'word.categoryId',
          foreignField: '_id',
          as: 'wordCategory',
        },
      },
      { $unwind: { path: '$wordCategory', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'translation.categoryId',
          foreignField: '_id',
          as: 'translationCategory',
        },
      },
      { $unwind: { path: '$translationCategory', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            wordCategoryId: '$word.categoryId',
            translationCategoryId: '$translation.categoryId',
          },
          wordCategoryName: { $first: { $ifNull: ['$wordCategory.name', 'Uncategorized'] } },
          translationCategoryName: { $first: { $ifNull: ['$translationCategory.name', 'Uncategorized'] } },
          total: { $sum: 1 },
          learned: { $sum: { $cond: [{ $gte: ['$repetitions', 5] }, 1, 0] } },
          avgEasiness: { $avg: '$easiness' },
          avgInterval: { $avg: '$interval' },
        },
      },
      {
        $project: {
          _id: 0,
          wordCategory: {
            id: '$_id.wordCategoryId',
            name: '$wordCategoryName',
          },
          translationCategory: {
            id: '$_id.translationCategoryId',
            name: '$translationCategoryName',
          },
          total: 1,
          learned: 1,
          avgEasiness: { $round: ['$avgEasiness', 2] },
          avgInterval: { $round: ['$avgInterval', 2] },
        },
      },
    ]);

    res.json({
      totalCards,
      reviewedToday,
      learnedCards,
      languageStats,
      categoriesStats,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: `Failed to fetch progress: ${error.message}` });
  }
});
*/

module.exports = router;
