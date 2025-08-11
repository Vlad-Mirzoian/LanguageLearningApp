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
    body("text").notEmpty().withMessage("Text is required").trim(),
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
    body("text")
      .optional()
      .notEmpty()
      .withMessage("Text cannot be empty if provided")
      .trim(),
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
