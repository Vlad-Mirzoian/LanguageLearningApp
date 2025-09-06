import express, { Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { param, body } from "express-validator";
import * as authController from "./authController";

const router: Router = express.Router();

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
    body("interfaceLanguageId")
      .notEmpty()
      .withMessage("interfaceLanguageId is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid interfaceLanguageId"),
    body("nativeLanguageId")
      .optional()
      .isMongoId()
      .withMessage("Invalid nativeLanguageId"),
    body("learningLanguagesIds")
      .optional()
      .isArray()
      .withMessage("LearningLanguagesIds must be an array")
      .custom((value: string[]) => {
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

// POST /api/auth/refresh
router.post("/refresh", authController.refresh);

// POST /api/auth/logout
router.post("/logout", authenticate, authController.logout);

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

export default router;
