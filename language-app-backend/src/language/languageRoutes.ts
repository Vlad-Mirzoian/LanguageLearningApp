import express, { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { body, param } from "express-validator";
import * as languageController from "./languageController";

const router: Router = express.Router();

// GET /api/languages
router.get("/", languageController.getLanguages);

// POST /api/languages
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  [
    body("code").isString().trim().notEmpty().withMessage("Code is required"),
    body("name").isString().trim().notEmpty().withMessage("Name is required"),
  ],
  validate,
  languageController.createLanguage
);

// PUT /api/languages/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid language ID"),
    body("code")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Code cannot be empty if provided"),
    body("name")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty if provided"),
  ],
  validate,
  languageController.updateLanguage
);

// DELETE /api/languages/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [param("id").isMongoId().withMessage("Invalid language ID")],
  validate,
  languageController.deleteLanguage
);

export default router;
