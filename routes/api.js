const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Card = require("../models/Card");
const User = require("../models/User");

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
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token, user: { email: user.email } });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(400).json({ error: `Failed to login user: ${error.message}` });
  }
});

// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

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

// GET /api/cards
router.get("/cards", authenticate, async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.userId });
    res.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ error: `Failed to fetch cards: ${error.message}` });
  }
});

// GET /api/cards/review
router.get("/cards/review", authenticate, async (req, res) => {
  try {
    const cards = await Card.find({
      userId: req.userId,
      nextReview: { $lte: new Date() },
    });
    res.json(cards);
  } catch (error) {
    console.error("Error fetching review cards:", error);
    res
      .status(500)
      .json({ error: `Failed to fetch review cards: ${error.message}` });
  }
});

// POST /api/cards
router.post("/cards", authenticate, async (req, res) => {
  try {
    const { word, translation, category } = req.body;
    if (!word || !translation) {
      return res
        .status(400)
        .json({ error: "Word and translation are required" });
    }
    const card = new Card({ userId: req.userId, word, translation, category });
    await card.save();
    res.status(201).json(card);
  } catch (error) {
    console.error("Error creating card:", error);
    res.status(400).json({ error: `Failed to create card: ${error.message}` });
  }
});

// PUT /api/cards/:id/review
router.put("/cards/:id/review", authenticate, async (req, res) => {
  try {
    const { quality } = req.body;
    if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
      res
        .status(400)
        .json({ error: "Quality must be an integer between 0 and 5" });
    }
    const card = await Card.findOne({ _id: req.params.id, userId: req.userId });
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
    const nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
    const updateCard = await Card.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { interval, nextReview, easiness, repetitions },
      { new: true }
    );
    res.json(updateCard);
  } catch (error) {
    console.error("Error reviewing card:", error);
    res.status(400).json({ error: `Failed to review card: ${error.message}` });
  }
});

// PUT /api/cards/:id
router.put("/cards/:id", authenticate, async (req, res) => {
  try {
    const { word, translation, category, interval, nextReview, easiness } =
      req.body;
    const updateData = {};
    if (word) updateData.word = word;
    if (translation) updateData.translation = translation;
    if (category !== undefined) updateData.category = category;
    if (interval !== undefined) updateData.interval = interval;
    if (nextReview) updateData.nextReview = nextReview;
    if (easiness !== undefined) updateData.easiness = easiness;
    if (!updateData.word || !updateData.translation) {
      return res
        .status(400)
        .json({ error: "Word and translation are required" });
    }
    const card = await Card.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );
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
    const card = await Card.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json({ message: "Card deleted" });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(400).json({ error: `Failed to delete card: ${error.message}` });
  }
});

module.exports = router;
