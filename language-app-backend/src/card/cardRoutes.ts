import express, { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { body, param, query } from "express-validator";
import * as cardController from "../card/cardController";

const router: Router = express.Router();

// GET /api/cards
router.get(
  "/",
  authenticate,
  [
    query("moduleId").optional().isMongoId().withMessage("Invalid module ID"),
    query("example")
      .optional()
      .isString()
      .trim()
      .withMessage("Text must be a string"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be an integer between 1 and 100")
      .toInt(),
    query("skip")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Skip must be a non-negative integer")
      .toInt(),
  ],
  validate,
  cardController.getCards
);

// GET /api/cards/review
router.get(
  "/review",
  authenticate,
  authorizeRoles(["user"]),
  [
    query("languageId")
      .exists({ checkFalsy: true })
      .withMessage("Language is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid language ID"),
    query("moduleId").optional().isMongoId().withMessage("Invalid module ID"),
  ],
  validate,
  cardController.getReviewCards
);

// GET /api/cards/test
router.get(
  "/test",
  authenticate,
  authorizeRoles(["user"]),
  [
    query("languageId")
      .exists({ checkFalsy: true })
      .withMessage("Language is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid language ID"),
    query("moduleId").optional().isMongoId().withMessage("Invalid module ID"),
  ],
  validate,
  cardController.getTestCards
);

// POST /api/cards/:id/submit
router.post(
  "/:id/submit",
  authenticate,
  authorizeRoles(["user"]),
  [
    param("id").isMongoId().withMessage("Invalid card ID"),
    body("languageId")
      .notEmpty()
      .withMessage("Language is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid language ID"),
    body("levelId")
      .notEmpty()
      .withMessage("Level is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid level ID"),
    body("type")
      .isIn(["flash", "test", "dictation"])
      .withMessage("Type must be on of: 'flash', 'test', 'dictation'"),
    body("attemptId").optional().isString().withMessage("Invalid attempt ID"),
    body("answer")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Answer is required"),
  ],
  validate,
  cardController.submitCard
);

// POST /api/cards
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  [
    body("wordId")
      .notEmpty()
      .withMessage("Original word is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid word ID"),
    body("translationId")
      .notEmpty()
      .withMessage("Translation word is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid translation ID"),
    body("moduleId")
      .notEmpty()
      .withMessage("Module is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid module ID"),
    body("example")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Example cannot be empty if provided"),
  ],
  validate,
  cardController.createCard
);

// PUT /api/cards/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid card ID"),
    body("wordId")
      .optional()
      .notEmpty()
      .withMessage("Original word cannot be empty if provided")
      .bail()
      .isMongoId()
      .withMessage("Invalid word ID"),
    body("translationId")
      .optional()
      .notEmpty()
      .withMessage("Translation word cannot be empty if provided")
      .bail()
      .isMongoId()
      .withMessage("Invalid translation ID"),
    body("moduleId")
      .optional()
      .notEmpty()
      .withMessage("Module cannot be empty if provided")
      .bail()
      .isMongoId()
      .withMessage("Invalid module ID"),
    body("example").optional({ checkFalsy: false }).isString().trim(),
  ],
  validate,
  cardController.updateCard
);

// DELETE /api/cards/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [param("id").isMongoId().withMessage("Invalid card ID")],
  validate,
  cardController.deleteCard
);

export default router;
