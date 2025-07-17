const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { parse } = require("csv-parse");
const { Parser } = require("json2csv");
const Card = require("../models/Card");
const User = require("../models/User");
const Category = require("../models/Category");

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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const hashed_password = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed_password });
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
      user: { email: user.email, role: user.role, settings: user.settings },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(400).json({ error: `Failed to login user: ${error.message}` });
  }
});

// PUT /api/user
router.put("/user", authenticate, async (req, res) => {
  try {
    const { email, password, settings } = req.body;
    const updateData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (settings) updateData.settings = settings;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    const user = await User.findOneAndUpdate({ _id: req.userId }, updateData, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      message: "User updated",
      user: { email: user.email, settings: user.settings },
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
      await Card.updateMany(
        { categoryId: req.params.id },
        { $set: { categoryId: null } }
      );
      res.json({ message: "Category deleted, cards updated" });
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
    const { categoryId } = req.query;
    const query = req.userRole === "admin" ? {} : { userId: req.userId };
    if (categoryId) {
      if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const category = await Category.findOne({ _id: categoryId });
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      query.categoryId = categoryId;
    }
    const cards = await Card.find(query).populate(
      "categoryId",
      "name"
    );
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
      const cards = await Card.find({
        userId: req.userId,
        nextReview: { $lte: new Date() },
      }).populate("categoryId", "name");
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
  authorizeRoles(["user"]),
  async (req, res) => {
    try {
      const { word, translation, categoryId } = req.body;
      if (!word || !translation) {
        return res
          .status(400)
          .json({ error: "Word and translation are required" });
      }
      if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      if (categoryId) {
        const category = await Category.findOne({
          _id: categoryId,
          userId: req.userId,
        });
        if (!category)
          return res.status(404).json({ error: "Category not found" });
      }
      const card = new Card({
        userId: req.userId,
        word,
        translation,
        categoryId,
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
      const card = await Card.findOne({
        _id: req.params.id,
        userId: req.userId,
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
        { _id: req.params.id, userId: req.userId },
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
router.put("/cards/:id", authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid card ID" });
    }
    const { word, translation, categoryId } = req.body;
    if (!word || !translation) {
      return res
        .status(400)
        .json({ error: "Word and translation are required" });
    }
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId });
      if (!category)
        return res.status(404).json({ error: "Category not found" });
    }
    const query =
      req.userRole === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, userId: req.userId };
    const updateData = { word, translation, categoryId };
    const card = await Card.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(card);
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(400).json({ error: `Failed to update card: ${error.message}` });
  }
});

// DELETE /api/cards/:id
router.delete("/cards/:id", authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid card ID" });
    }
    const query =
      req.userRole === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, userId: req.userId };
    const card = await Card.findOneAndDelete(query);
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json({ message: "Card deleted" });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(400).json({ error: `Failed to delete card: ${error.message}` });
  }
});

// GET /api/progress
router.get(
  "/progress",
  authenticate,
  authorizeRoles(["user"]),
  async (req, res) => {
    try {
      const totalCards = await Card.countDocuments({ userId: req.userId });
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const reviewedToday = await Card.countDocuments({
        userId: req.userId,
        lastReviewed: { $gte: startOfDay },
      });
      const learnedCards = await Card.countDocuments({
        userId: req.userId,
        repetitions: { $gte: 5 },
      });
      const categoriesStats = await Card.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
        {
          $group: {
            _id: "$categoryId",
            total: { $sum: 1 },
            learned: { $sum: { $cond: [{ $gte: ["$repetitions", 5] }, 1, 0] } },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            categoryName: { $ifNull: ["$category.name", "Uncategorized"] },
            total: 1,
            learned: 1,
          },
        },
      ]);
      res.json({ totalCards, reviewedToday, learnedCards, categoriesStats });
    } catch (error) {
      console.error("Error fetching progress", error);
      res
        .status(500)
        .json({ error: `Failed to fetch progress ${error.message}` });
    }
  }
);

// POST /api/cards/import
router.post(
  "/cards/import",
  authenticate,
  authorizeRoles(["user"]),
  async (req, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData) {
        return res.status(400).json({ error: "CSV data is required" });
      }
      const cards = [];
      parse(csvData, { columns: true, trim: true }, async (err, records) => {
        if (err) {
          return res.status(400).json({ error: "Invalid CSV format" });
        }
        records.forEach((record) => {
          if (record.word && record.translation) {
            cards.push({
              userId: req.userId,
              word: record.word,
              translation: record.translation,
            });
          }
        });
        if (cards.length === 0) {
          return res.status(400).json({ error: "No valid cards found in CSV" });
        }
        await Card.insertMany(cards);
        res.json({ message: `Imported ${cards.length} cards` });
      });
    } catch (error) {
      console.error("Error importing cards", error);
      res
        .status(400)
        .json({ error: `Failed to import cards ${error.message}` });
    }
  }
);

// GET /api/cards/export
router.get("/cards/export", authenticate, async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.userId });
    const fields = ["word", "translation"];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(cards);
    res.header("Content-Type", "text/csv");
    res.attachment("cards.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting cards", error);
    res.status(500).json({ error: `Failed to export cards ${error.message}` });
  }
});

// POST /api/categories/import
router.post(
  "/categories/import",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData) {
        return res.status(400).json({ error: "CSV data is required" });
      }
      const categories = [];
      parse(csvData, { columns: true, trim: true }, async (err, records) => {
        if (err) {
          return res.status(400).json({ error: "Invalid CSV format" });
        }
        records.forEach((record) => {
          if (record.name) {
            categories.push({
              name: record.name,
              description: record.description || "",
            });
          }
        });
        if (categories.length === 0) {
          return res
            .status(400)
            .json({ error: "No valid categories found in CSV" });
        }
        await Category.insertMany(categories);
        res.json({ message: `Imported ${categories.length} categories` });
      });
    } catch (error) {
      console.error("Error importing categories", error);
      res
        .status(400)
        .json({ error: `Failed to import categories: ${error.message}` });
    }
  }
);

// GET /api/categories/export
router.get("/categories/export", authenticate, async (req, res) => {
  try {
    const categories = await Category.find();
    const fields = ["name", "description"];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(categories);
    res.header("Content-Type", "text/csv");
    res.attachment("categories.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting categories", error);
    res
      .status(500)
      .json({ error: `Failed to export categories ${error.message}` });
  }
});

module.exports = router;
