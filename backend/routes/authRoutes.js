const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const upload = require("../middleware/upload");
const { param, body } = require("express-validator");
const authController = require("../controllers/authController");

// POST /api/auth/register
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("username")
      .matches(/^[a-z0-9_]{6,}$/)
      .withMessage(
        "Username must be at least 6 characters and contain only lowercase letters, numbers, or underscores"
      ),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("nativeLanguageId")
      .optional()
      .isMongoId()
      .withMessage("Invalid nativeLanguageId"),
    body("learningLanguagesIds")
      .optional()
      .isArray()
      .withMessage("LearningLanguagesIds must be an array")
      .custom((value) => {
        if (value.length === 0) return true;
        for (const id of value) {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`Invalid learning language ID ${id}`);
          }
        }
        return true;
      }),
  ],
  validate,
  authController.register
);

// GET /api/auth/verify/:token
router.get(
  "/verify/:token",
  [param("token").notEmpty().withMessage("Verification token is required")],
  validate,
  authController.verifyEmail
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("identifier").isString().withMessage("Identifier must be a string"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  authController.login
);

// POST /api/auth/upload-avatar
router.post(
  "/upload-avatar",
  authenticate,
  upload.single("avatar"),
  authController.uploadAvatar
);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Invalid email format")],
  validate,
  authController.forgotPassword
);

// POST /api/auth/reset-password/:token
router.post(
  "/reset-password/:token",
  [
    param("token").notEmpty().withMessage("Reset token is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  authController.resetPassword
);

// PUT /api/auth/user
router.put(
  "/user",
  authenticate,
  [
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("username")
      .optional()
      .matches(/^[a-z0-9_]{6,}$/)
      .withMessage(
        "Username must be at least 6 characters and contain only lowercase letters, numbers, or underscores"
      ),
    body("password")
      .optional()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("nativeLanguageId")
      .optional()
      .isMongoId()
      .withMessage("Invalid nativeLanguageId"),
    body("learningLanguagesIds")
      .optional()
      .isArray()
      .withMessage("LearningLanguagesIds must be an array")
      .custom((value) => {
        if (value.length === 0) return true;
        for (const id of value) {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`Invalid learning language ID ${id}`);
          }
        }
        return true;
      }),
  ],
  validate,
  authController.updateUser
);

// DELETE /api/auth/user
router.delete("/user", authenticate, authController.deleteUser);

module.exports = router;
