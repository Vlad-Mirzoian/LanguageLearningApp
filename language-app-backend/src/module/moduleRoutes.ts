import express, { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { body, param, query } from "express-validator";
import * as moduleController from "./moduleController";

const router: Router = express.Router();

// GET /api/modules
router.get(
  "/",
  authenticate,
  [
    query("languageId")
      .optional()
      .isMongoId()
      .withMessage("Invalid language ID"),
    query("name")
      .optional()
      .isString()
      .trim()
      .withMessage("Name must be a string"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be an integer between 1 and 100")
      .toInt(),
    query("skip")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Skip must be a non-negative integer")
      .toInt(),
  ],
  validate,
  moduleController.getModules
);

// POST /api/modules
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  [
    body("name").isString().trim().notEmpty().withMessage("Name is required"),
    body("languageId")
      .notEmpty()
      .withMessage("Language is required")
      .bail()
      .isMongoId()
      .withMessage("Invalid language ID"),
    body("description")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Description cannot be empty if provided"),
    body("order")
      .isInt({ min: 1 })
      .withMessage("Order must be a positive integer"),
    body("requiredScore")
      .isInt({ min: 0 })
      .withMessage("Required score must be a non-negative integer"),
  ],
  validate,
  moduleController.createModule
);

// PUT /api/modules/order
router.put(
  "/order",
  authenticate,
  authorizeRoles(["admin"]),
  [
    body("orders")
      .isArray({ min: 1 })
      .withMessage("Orders must be a non-empty array"),
    body("orders.*.id")
      .isMongoId()
      .withMessage("Each order must contain a valid module ID"),
    body("orders.*.order")
      .isInt({ min: 1 })
      .withMessage("Each order must be a positive integer"),
  ],
  validate,
  moduleController.updateModuleOrders
);

// PUT /api/modules/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid module ID"),
    body("name")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty if provided"),
    body("languageId")
      .optional()
      .notEmpty()
      .withMessage("Language cannot be empty if provided")
      .bail()
      .isMongoId()
      .withMessage("Invalid language ID"),
    body("description").optional({ checkFalsy: false }).isString().trim(),
    body("order")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Order must be a positive integer"),
    body("requiredScore")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Required score must be a non-negative integer"),
  ],
  validate,
  moduleController.updateModule
);

// DELETE /api/modules/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [param("id").isMongoId().withMessage("Invalid module ID")],
  validate,
  moduleController.deleteModule
);

export default router;
