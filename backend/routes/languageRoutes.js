const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { body, param } = require("express-validator");
const languageController = require("../controllers/languageController");

// GET /api/languages
router.get("/", languageController.getLanguages);

// POST /api/languages
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  [
    body("code").notEmpty().withMessage("Code is required").trim(),
    body("name").notEmpty().withMessage("Name is required").trim(),
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
      .notEmpty()
      .withMessage("Code cannot be empty if provided")
      .trim(),
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Name cannot be empty if provided")
      .trim(),
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

module.exports = router;
