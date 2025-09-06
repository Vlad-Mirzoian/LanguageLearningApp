import express, { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { query } from "express-validator";
import * as languageProgressController from "./languageProgressController";

const router: Router = express.Router();

// GET /api/language-progress
router.get(
  "/",
  authenticate,
  authorizeRoles(["user"]),
  [
    query("languageId")
      .optional()
      .isMongoId()
      .withMessage("Invalid language ID"),
    query("moduleId").optional().isMongoId().withMessage("Invalid module ID"),
  ],
  validate,
  languageProgressController.getLanguageProgress
);

export default router;
