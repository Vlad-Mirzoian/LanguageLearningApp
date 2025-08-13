const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { body, param } = require("express-validator");
const categoryController = require("../controllers/categoryController");

// GET /api/categories
router.get("/", authenticate, categoryController.getCategories);

// POST /api/categories
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  [
    body("name").isString().trim().notEmpty().withMessage("Name is required"),
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
  categoryController.createCategory
);

// PUT /api/categories/order
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
      .withMessage("Each order must contain a valid category ID"),
    body("orders.*.order")
      .isInt({ min: 1 })
      .withMessage("Each order must be a positive integer"),
  ],
  validate,
  categoryController.updateCategoryOrders
);

// PUT /api/categories/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [
    param("id").isMongoId().withMessage("Invalid category ID"),
    body("name")
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty if provided"),
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
  categoryController.updateCategory
);

// DELETE /api/categories/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [param("id").isMongoId().withMessage("Invalid category ID")],
  validate,
  categoryController.deleteCategory
);

module.exports = router;
