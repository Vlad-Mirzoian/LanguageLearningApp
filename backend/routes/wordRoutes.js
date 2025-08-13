const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { query, body, param } = require("express-validator");
const wordController = require("../controllers/wordController");

// GET /api/words
router.get(
  "/",
  authenticate,
  [
    query("languageId")
      .optional()
      .isMongoId()
      .withMessage("Invalid language ID"),
    query("text")
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
  wordController.getWords
);

// POST /api/words
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  [
    body("text").isString().trim().notEmpty().withMessage("Text is required"),
    body("languageId")
      .notEmpty()
      .withMessage("Language is required")
      .isMongoId()
      .withMessage("Invalid language ID"),
  ],
  validate,
  wordController.createWord
);

// GET /api/words/check-unique
router.get(
  "/check-unique",
  authenticate,
  authorizeRoles(["admin"]),
  [
    query("text").notEmpty().withMessage("Text is required").trim(),
    query("languageId")
      .notEmpty()
      .withMessage("Language is required")
      .isMongoId()
      .withMessage("Invalid language ID"),
  ],
  validate,
  wordController.checkUnique
);

// PUT /api/words/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid word ID"),
    body("Text")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Text cannot be empty if provided"),
    body("languageId")
      .optional()
      .notEmpty()
      .withMessage("Language cannot be empty if provided")
      .isMongoId()
      .withMessage("Invalid language ID"),
  ],
  validate,
  wordController.updateWord
);

// DELETE /api/words/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [param("id").isMongoId().withMessage("Invalid word ID")],
  validate,
  wordController.deleteWord
);

module.exports = router;
