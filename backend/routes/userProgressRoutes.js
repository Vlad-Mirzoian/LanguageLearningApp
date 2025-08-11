const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { query } = require("express-validator");
const userProgressController = require("../controllers/userProgressController");

// GET /api/user-progress
router.get(
  "/",
  authenticate,
  authorizeRoles(["user"]),
  [
    query("languageId")
      .optional()
      .isMongoId()
      .withMessage("Invalid language ID"),
    query("categoryId")
      .optional()
      .isMongoId()
      .withMessage("Invalid category ID"),
  ],
  validate,
  userProgressController.getUserProgress
);

module.exports = router;
