import express, { Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validation";
import upload from "../middleware/upload";
import { body } from "express-validator";
import * as userController from "./userController";

const router: Router = express.Router();

// POST /api/user/upload-avatar
router.post(
  "/upload-avatar",
  authenticate,
  upload.single("avatar"),
  userController.uploadAvatar
);

// PUT /api/user/interface-language
router.put(
  "/interface-language",
  authenticate,
  [
    body("interfaceLanguageId")
      .notEmpty()
      .withMessage("interfaceLanguageId is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid interfaceLanguageId"),
  ],
  validate,
  userController.updateInterfaceLanguage
);

// PUT /api/user
router.put(
  "/",
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
      .optional({ nullable: true, checkFalsy: true })
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
  userController.updateUser
);

// DELETE /api/user/delete-avatar
router.delete("/delete-avatar", authenticate, userController.deleteAvatar);

// DELETE /api/user
router.delete("/", authenticate, userController.deleteUser);

export default router;
