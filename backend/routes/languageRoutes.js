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

module.exports = router;
