const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { query } = require("express-validator");
const languageProgressController = require("../controllers/languageProgressController");

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

module.exports = router;
