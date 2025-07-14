const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
    const token = jwt.sign({ userId: user._id }, "secret", { expiresIn: "1h" });
    res.json({ token, user: { email: user.email } });
  } catch (error) {
    console.error("Error logging in:", error);
    res
      .status(400)
      .json({ error: `Failed to login user: ${error.message}` });
  }
});

// Middleware для проверки JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/*
// GET /api/cards
router.get("/cards", async (req, res) => {
  try {
    res.status(200).json(card);
  } catch (error) {
    console.error("Error getting cards:", error);
    res.status(400).json({ error: `Failed to get cards: ${error.message}` });
  }
});
*/

// POST /api/cards
router.post("/cards", authenticate, async (req, res) => {
  try {
    const { word, translation, category } = req.body;
    if (!word || !translation) {
      return res
        .status(400)
        .json({ error: "Word, and translation are required" });
    }
    const card = new Card({ userId: req.userId, word, translation, category });
    await card.save();
    res.status(201).json(card);
  } catch (error) {
    console.error("Error creating card:", error);
    res.status(400).json({ error: `Failed to create card: ${error.message}` });
  }
});

/*
// PUT /api/cards
router.put("/cards", async (req, res) => {
  try {
    res.status(200).json(card);
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(400).json({ error: `Failed to update card: ${error.message}` });
  }
});

// DELETE /api/cards
router.delete("/cards", async (req, res) => {
  try {
    res.status(200).json(card);
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(400).json({ error: `Failed to delete card: ${error.message}` });
  }
});
*/

module.exports = router;
