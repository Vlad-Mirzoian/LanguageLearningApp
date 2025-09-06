import express, { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { query } from "express-validator";
import * as statsController from "../stats/statsController";

const router: Router = express.Router();

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

export default router;
