import express, { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { query } from "express-validator";
import * as leaderboardController from "./leaderboardController";

const router: Router = express.Router();

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

export default router;
