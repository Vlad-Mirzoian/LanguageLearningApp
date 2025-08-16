const express = require("express");
const router = express.Router();
const { param } = require("express-validator");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const attemptController = require("../controllers/attemptController");

// POST /api/attempts/:id/share
router.post(
  "/:id/share",
  authenticate,
  authorizeRoles(["user"]),
  [param("id").isUUID(4).withMessage("Invalid attempt ID")],
  validate,
  attemptController.shareAttempt
);

// GET /api/attempts/view/:token
router.get(
  "/view/:token",
  [param("token").notEmpty().withMessage("Token is required")],
  validate,
  attemptController.viewAttempt
);

module.exports = router;
