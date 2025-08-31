const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Language = require("../models/Language");
const Module = require("../models/Module");
const Level = require("../models/Level");
const ModuleProgress = require("../models/ModuleProgress");
const LevelProgress = require("../models/LevelProgress");
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
        interfaceLanguageId,
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

      const intLang = await Language.findById(interfaceLanguageId).lean();
      if (!intLang) {
        return res.status(400).json({ error: "Interface language not found" });
      }

      if (nativeLanguageId) {
        const natLang = await Language.findById(nativeLanguageId).lean();
        if (!natLang) {
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
        interfaceLanguageId,
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
      })
        .populate("interfaceLanguageId")
        .lean();
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (!user.isVerified) {
        return res
          .status(403)
          .json({ error: "Please verify your email before logging in" });
      }

      const accessToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = crypto.randomBytes(32).toString("hex");
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const refreshTokenExpires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      );

      await User.updateOne(
        { _id: user._id },
        {
          refreshToken: refreshTokenHash,
          refreshTokenExpires: refreshTokenExpires,
        }
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        token: accessToken,
        user: {
          email: user.email,
          username: user.username,
          role: user.role,
          interfaceLanguage: user.interfaceLanguageId,
          nativeLanguageId: user.nativeLanguageId,
          learningLanguagesIds: user.learningLanguagesIds,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      res.status(500).json({ error: `Failed to login user: ${error.message}` });
    }
  },

  async refresh(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token not provided" });
      }
      const user = await User.findOne({
        refreshTokenExpires: { $gt: new Date() },
      });
      if (!user) {
        return res
          .status(401)
          .json({ error: "Invalid or expired refresh token" });
      }
      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const accessToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );
      const newRefreshToken = crypto.randomBytes(32).toString("hex");
      const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
      const newRefreshTokenExpires = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      );
      await User.updateOne(
        { _id: user._id },
        {
          refreshToken: newRefreshTokenHash,
          refreshTokenExpires: newRefreshTokenExpires,
        }
      );
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ token: accessToken });
    } catch (error) {
      res.status(500).json({ error: `Token refresh failed: ${error.message}` });
    }
  },

  async logout(req, res) {
    try {
      await User.updateOne(
        {
          _id: req.userId,
        },
        {
          refreshToken: null,
          refreshTokenExpires: null,
        }
      );
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ error: `Logout failed: ${error.message}` });
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
        avatar: user.avatar,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to upload avatar: ${error.message}` });
    }
  },

  async updateInterfaceLanguage(req, res) {
    try {
      const { interfaceLanguageId } = req.body;
      if (interfaceLanguageId) {
        const lang = await Language.findById(interfaceLanguageId).lean();
        if (!lang) {
          return res
            .status(400)
            .json({ error: "Preferred language not found" });
        }
      }
      const user = await User.findOneAndUpdate(
        { _id: req.userId },
        { interfaceLanguageId },
        { new: true }
      )
        .populate("interfaceLanguageId")
        .lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ interfaceLanguage: user.interfaceLanguageId });
    } catch (error) {
      res.status(500).json({
        error: `Failed to update interface language: ${error.message}`,
      });
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

      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentLearningLanguages = user.learningLanguagesIds || [];
      const newLanguages = (learningLanguagesIds || []).filter(
        (langId) =>
          !currentLearningLanguages.some(
            (currentId) => currentId.toString() === langId
          )
      );
      const removedLanguages = currentLearningLanguages.filter(
        (langId) =>
          !(learningLanguagesIds || []).some(
            (newId) => newId === langId.toString()
          )
      );

      if (removedLanguages.length > 0) {
        await ModuleProgress.deleteMany({
          userId: req.userId,
          languageId: { $in: removedLanguages },
        });
        await LevelProgress.deleteMany({
          userId: req.userId,
          languageId: { $in: removedLanguages },
        });
      }

      const updateData = {
        ...(email && { email }),
        ...(username && { username: username.toLowerCase() }),
        ...(password && { password: await bcrypt.hash(password, 10) }),
        ...(nativeLanguageId !== undefined && { nativeLanguageId }),
        ...(learningLanguagesIds && { learningLanguagesIds }),
      };

      const updatedUser = await User.findOneAndUpdate(
        { _id: req.userId },
        updateData,
        { new: true, lean: true }
      );

      for (const langId of newLanguages) {
        const firstModule = await Module.findOne({ languageId: langId })
          .sort({ order: 1 })
          .lean();
        if (!firstModule) {
          console.warn(`No modules found for language ID: ${langId}`);
          continue;
        }

        await ModuleProgress.create({
          userId: req.userId,
          languageId: langId,
          moduleId: firstModule._id,
          totalLevels: firstModule.totalLevels,
          completedLevels: 0,
          bestScore: 0,
          unlocked: firstModule.order === 1,
          achievements: [],
        });

        const levels = await Level.find({ moduleId: firstModule._id })
          .sort({ order: 1 })
          .lean();
        if (levels.length === 0) {
          console.warn(`No levels found for module ID: ${firstModule._id}`);
          continue;
        }

        const levelProgresses = levels.map((level, index) => ({
          userId: req.userId,
          languageId: langId,
          moduleId: firstModule._id,
          levelId: level._id,
          bestScore: 0,
          unlocked: index === 0,
        }));

        await LevelProgress.insertMany(levelProgresses);
      }

      res.json({
        message: "User updated",
        user: {
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          nativeLanguageId: updatedUser.nativeLanguageId,
          learningLanguagesIds: updatedUser.learningLanguagesIds,
          avatar: updatedUser.avatar,
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
