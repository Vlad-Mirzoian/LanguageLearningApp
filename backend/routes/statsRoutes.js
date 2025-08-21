const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { query } = require("express-validator");
const statsController = require("../controllers/statsController");

router.get(
  "/",
  authenticate,
  authorizeRoles(["user"]),
  [
    query("languageId")
      .exists({ checkFalsy: true })
      .withMessage("Language is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid language ID"),
  ],
  validate,
  statsController.getStats
);

module.exports = router;
