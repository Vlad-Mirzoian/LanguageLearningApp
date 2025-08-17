const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { body, param, query } = require("express-validator");
const cardController = require("../controllers/cardController");

// GET /api/cards
router.get(
  "/",
  authenticate,
  [
    query("categoryId")
      .optional()
      .isMongoId()
      .withMessage("Invalid category ID"),
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
      .isMongoId()
      .withMessage("Invalid language ID"),
    query("categoryId")
      .optional()
      .isMongoId()
      .withMessage("Invalid category ID"),
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
      .isMongoId()
      .withMessage("Invalid language ID"),
    query("categoryId")
      .optional()
      .isMongoId()
      .withMessage("Invalid category ID"),
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
      .isMongoId()
      .withMessage("Invalid language ID"),
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
      .isMongoId()
      .withMessage("Invalid word ID"),
    body("translationId")
      .notEmpty()
      .withMessage("Translation word is required")
      .isMongoId()
      .withMessage("Invalid translation ID"),
    body("categoryId")
      .notEmpty()
      .withMessage("Category is required")
      .isMongoId()
      .withMessage("Invalid category ID"),
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
      .isMongoId()
      .withMessage("Invalid word ID"),
    body("translationId")
      .optional()
      .notEmpty()
      .withMessage("Translation word cannot be empty if provided")
      .isMongoId()
      .withMessage("Invalid translation ID"),
    body("categoryId")
      .optional()
      .notEmpty()
      .withMessage("Category cannot be empty if provided")
      .isMongoId()
      .withMessage("Invalid category ID"),
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

module.exports = router;
