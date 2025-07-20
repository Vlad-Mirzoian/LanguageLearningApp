const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Language = require("../models/Language");
const { authenticate } = require("../middleware/auth");

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

module.exports = router;