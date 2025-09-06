import express, { Router } from "express";
import { param } from "express-validator";
import { authenticate, authorizeRoles } from "../middleware/auth";
import { validate } from "../middleware/validation";
import * as attemptController from "./attemptController";

const router: Router = express.Router();

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

export default router;
