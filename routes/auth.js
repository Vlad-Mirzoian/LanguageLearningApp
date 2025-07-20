const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Language = require("../models/Language");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { body } = require("express-validator");

// POST /api/register
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("nativeLanguageId")
      .optional()
      .isMongoId().withMessage("Invalid nativeLanguageId")
      .custom(async (value) => {
        const lang = await Language.findById(value);
        if (!lang) throw new Error("Native language not found");
        return true;
      }),
    body("learningLanguagesIds")
      .optional()
      .isArray("LearningLanguagesIds must be an array")
      .custom(async (value) => {
        if (value.length === 0) return true;
        for (const id of value) {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`Invalid learning language ID ${id}`);
          }
          const lang = await Language.findById(id);
          if (!lang) throw new Error(`Learning language not found: ${id}`);
        }
        return true;
      }),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, nativeLanguageId, learningLanguagesIds } =
        req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
      if (learningLanguagesIds && !Array.isArray(learningLanguagesIds)) {
        return res
          .status(400)
          .json({ error: "LearningLanguagesIds must be an array" });
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
        .status(500)
        .json({ error: `Failed to register user: ${error.message}` });
    }
  }
);

// POST /api/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
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
      res.status(500).json({ error: `Failed to login user: ${error.message}` });
    }
  }
);

// PUT /api/user
router.put(
  "/user",
  [
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("password")
      .optional()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("nativeLanguageId")
      .optional()
      .isMongoId().withMessage("Invalid nativeLanguageId")
      .custom(async (value) => {
        const lang = await Language.findById(value);
        if (!lang) throw new Error("Native language not found");
        return true;
      }),
    body("learningLanguagesIds")
      .optional()
      .isArray("LearningLanguagesIds must be an array")
      .custom(async (value) => {
        if (value.length === 0) return true;
        for (const id of value) {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`Invalid learning language ID ${id}`);
          }
          const lang = await Language.findById(id);
          if (!lang) throw new Error(`Learning language not found: ${id}`);
        }
        return true;
      }),
  ],
  validate,
  authenticate,
  async (req, res) => {
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
      if (nativeLanguageId) updateData.nativeLanguageId = nativeLanguageId;
      if (learningLanguagesIds) {
        updateData.learningLanguagesIds = learningLanguagesIds;
      }
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      const user = await User.findOneAndUpdate(
        { _id: req.userId },
        updateData,
        { new: true }
      );
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
        .status(500)
        .json({ error: `Failed to update user credentials: ${error.message}` });
    }
  }
);

// DELETE /api/user
router.delete("/user", authenticate, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.userId,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User and associated cards deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(400).json({ error: `Failed to delete user: ${error.message}` });
  }
});

module.exports = router;