const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Language = require("../models/Language");
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils/email");

const authController = {
  async register(req, res) {
    try {
      const {
        email,
        username,
        password,
        nativeLanguageId,
        learningLanguagesIds,
      } = req.body;

      const existingUser = await User.findOne({
        $or: [{ email }, { username: username.toLowerCase() }],
      }).lean();
      if (existingUser) {
        return res.status(400).json({
          error:
            existingUser.email === email
              ? "Email already exists"
              : "Username already exists",
        });
      }

      if (nativeLanguageId) {
        const lang = await Language.findById(nativeLanguageId).lean();
        if (!lang) {
          return res.status(400).json({ error: "Native language not found" });
        }
      }
      if (learningLanguagesIds && learningLanguagesIds.length > 0) {
        const langs = await Language.find({
          _id: { $in: learningLanguagesIds },
        }).lean();
        if (langs.length !== learningLanguagesIds.length) {
          return res
            .status(400)
            .json({ error: "One or more learning languages not found" });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      const user = new User({
        email,
        username: username.toLowerCase(),
        password: hashedPassword,
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
      res
        .status(500)
        .json({ error: `Failed to register user: ${error.message}` });
    }
  },

  async verifyEmail(req, res) {
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
      res
        .status(500)
        .json({ error: `Failed to verify email: ${error.message}` });
    }
  },

  async login(req, res) {
    try {
      const { identifier, password } = req.body;
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
        ],
      }).lean();
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
        { expiresIn: "1h" }
      );
      res.json({
        token,
        user: {
          email: user.email,
          username: user.username,
          role: user.role,
          nativeLanguageId: user.nativeLanguageId,
          learningLanguagesIds: user.learningLanguagesIds,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      res.status(500).json({ error: `Failed to login user: ${error.message}` });
    }
  },

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email }).lean();
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
        { expiresIn: "1h" }
      );
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          resetPasswordToken: resetToken,
          resetPasswordExpires: new Date(Date.now() + 3600000),
        },
        { runValidators: true }
      );

      await sendResetPasswordEmail(email, resetToken);
      res.json({ message: "Password reset link sent to your email" });
    } catch (error) {
      res.status(500).json({
        error: `Failed to send reset password email: ${error.message}`,
      });
    }
  },

  async resetPassword(req, res) {
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
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
        { new: true, lean: true }
      );

      if (!user) {
        return res
          .status(400)
          .json({ error: "User not found or token invalid" });
      }
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to reset password: ${error.message}` });
    }
  },

  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      const user = await User.findOneAndUpdate(
        { _id: req.userId },
        { avatar: avatarPath },
        { new: true, lean: true }
      );
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        message: "Avatar uploaded successfully",
        user: {
          email: user.email,
          username: user.username,
          role: user.role,
          nativeLanguageId: user.nativeLanguageId,
          learningLanguagesIds: user.learningLanguagesIds,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to upload avatar: ${error.message}` });
    }
  },

  async updateUser(req, res) {
    try {
      const {
        email,
        username,
        password,
        nativeLanguageId,
        learningLanguagesIds,
      } = req.body;

      const conditions = [
        email ? { email, _id: { $ne: req.userId } } : null,
        username
          ? { username: username.toLowerCase(), _id: { $ne: req.userId } }
          : null,
      ].filter(Boolean);
      let existingUser = null;
      if (conditions.length > 0) {
        existingUser = await User.findOne({ $or: conditions }).lean();
      }
      if (existingUser) {
        return res.status(400).json({
          error:
            existingUser.email === email
              ? "Email already exists"
              : "Username already exists",
        });
      }

      if (nativeLanguageId) {
        const lang = await Language.findById(nativeLanguageId).lean();
        if (!lang) {
          return res.status(400).json({ error: "Native language not found" });
        }
      }
      if (learningLanguagesIds && learningLanguagesIds.length > 0) {
        const langs = await Language.find({
          _id: { $in: learningLanguagesIds },
        }).lean();
        if (langs.length !== learningLanguagesIds.length) {
          return res
            .status(400)
            .json({ error: "One or more learning languages not found" });
        }
      }

      const updateData = {
        ...(email && { email }),
        ...(username && { username: username.toLowerCase() }),
        ...(password && { password: await bcrypt.hash(password, 10) }),
        ...(nativeLanguageId && { nativeLanguageId }),
        ...(learningLanguagesIds && { learningLanguagesIds }),
      };

      const user = await User.findOneAndUpdate(
        { _id: req.userId },
        updateData,
        { new: true, lean: true }
      );
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        message: "User updated",
        user: {
          email: user.email,
          username: user.username,
          role: user.role,
          nativeLanguageId: user.nativeLanguageId,
          learningLanguagesIds: user.learningLanguagesIds,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to update user: ${error.message}` });
    }
  },

  async deleteUser(req, res) {
    try {
      const user = await User.findOneAndDelete({ _id: req.userId });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted" });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to delete user: ${error.message}` });
    }
  },
};

module.exports = authController;
