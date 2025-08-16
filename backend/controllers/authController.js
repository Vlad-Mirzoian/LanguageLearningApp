const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
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
      const verificationToken = uuidv4();
      const verificationTokenExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

      const user = new User({
        email,
        username: username.toLowerCase(),
        password: hashedPassword,
        nativeLanguageId,
        learningLanguagesIds,
        isVerified: false,
        verificationToken,
        verificationTokenExpires,
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
      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: new Date() },
      });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      if (user.isVerified) {
        return res.status(400).json({ error: "Email already verified" });
      }
      user.isVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpires = null;
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
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.isVerified) {
        return res.status(403).json({
          error: "Please verify your email before resetting your password",
        });
      }
      const resetToken = uuidv4();
      const resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000);
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save({ runValidators: true });
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
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
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
