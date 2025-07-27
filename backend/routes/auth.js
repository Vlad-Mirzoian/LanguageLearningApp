const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Language = require("../models/Language");
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils/email");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { param, body } = require("express-validator");

// POST /api/auth/register
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("nativeLanguageId")
      .optional()
      .isMongoId()
      .withMessage("Invalid nativeLanguageId")
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
      const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      const user = new User({
        email,
        password: hashed_password,
        nativeLanguageId,
        learningLanguagesIds,
        verificationToken,
      });
      await user.save();
      await sendVerificationEmail(email, verificationToken);
      res
        .status(201)
        .json({ message: "User registered. Please verify your email" });
    } catch (error) {
      console.error("Error registering user:", error);
      res
        .status(500)
        .json({ error: `Failed to register user: ${error.message}` });
    }
  }
);

// GET /api/auth/verify/:token
router.get(
  "/verify/:token",
  [param("token").notEmpty().withMessage("Verification token is required")],
  validate,
  async (req, res) => {
    try {
      const { token } = req.params;
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return res
          .status(400)
          .json({ error: "Invalid or expired verification token" });
      }
      const user = await User.findOne({ email: decoded.email });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      if (user.isVerified) {
        return res.status(400).json({ error: "Email already verified" });
      }
      if (user.verificationToken !== token) {
        return res.status(400).json({ error: "Invalid verification token" });
      }
      user.isVerified = true;
      user.verificationToken = null;
      await user.save();
      res.json({ message: "User verified successfully" });
    } catch (error) {
      console.error("Error verifying email:", error);
      res
        .status(500)
        .json({ error: `Failed to verify email: ${error.message}` });
    }
  }
);

// POST /api/auth/login
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
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (!user.isVerified) {
        return res
          .status(403)
          .json({ error: "Please verify your email before logging in" });
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

// POST /api/auth/forgot-password
router.post("/forgot-password", [
  body("email").isEmail().withMessage("Invalid email format"),
  validate,
  async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.isVerified) {
        return res.status(403).json({
          error: "Please verify your email before resetting your password",
        });
      }
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000);
      await user.save();
      await sendResetPasswordEmail(email, resetToken);
      res.json({ message: "Password reset link sent to your email" });
    } catch (error) {
      console.error("Error sending reset password email:", error);
      res.status(500).json({
        error: `Failed to send reset password email: ${error.message}`,
      });
    }
  },
]);

// POST /api/auth/reset-password/:token
router.post(
  "/reset-password/:token",
  [
    [param("token").notEmpty().withMessage("Reset token is required")],
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return res
          .status(500)
          .json({ error: "Invalid or expired reset token" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.findOneAndUpdate(
        {
          _id: decoded.userId,
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: new Date() },
          isVerified: true,
        },
        {
          $set: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
          },
        },
        { new: true }
      );
      if (!user) {
        return res
          .status(400)
          .json({ error: "User not found or token invalid" });
      }
      await user.save();
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res
        .status(500)
        .json({ error: `Failed to reset password: ${error.message}` });
    }
  }
);

// PUT /api/auth/user
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
      .isMongoId()
      .withMessage("Invalid nativeLanguageId")
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

// DELETE /api/auth/user
router.delete("/user", authenticate, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.userId,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User and associated cards deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: `Failed to delete user: ${error.message}` });
  }
});

module.exports = router;
