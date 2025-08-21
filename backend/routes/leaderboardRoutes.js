const express = require("express");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { query } = require("express-validator");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboardController");

// GET /api/leaderboard
router.get(
  "/",
  authenticate,
  authorizeRoles(["user"]),
  [
    query("languageId")
      .notEmpty()
      .withMessage("Language is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid language ID"),
  ],
  validate,
  leaderboardController.getLeaderboard
);

module.exports = router;
