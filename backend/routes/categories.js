const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Card = require("../models/Card");
const Category = require("../models/Category");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { body, param } = require("express-validator");

// GET /api/categories
router.get("/", authenticate, async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories", error);
    res
      .status(500)
      .json({ error: `Failed to fetch categories: ${error.message}` });
  }
});

// POST /api/categories
router.post(
  "/",
  authenticate,
  authorizeRoles(["admin"]),
  [
    body("name").notEmpty().withMessage("Name are required").trim(),
    body("description").optional().trim(),
    body("order")
      .isInt({ min: 1 })
      .withMessage("Order must be a positive integer"),
    body("requiredScore")
      .isInt({ min: 0 })
      .withMessage("Required score must be a non-negative integer"),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description, order, requiredScore } = req.body;
      const category = new Category({
        name,
        description,
        order,
        requiredScore,
      });
      await category.save();
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category", error);
      res
        .status(500)
        .json({ error: `Failed to create category: ${error.message}` });
    }
  }
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
  async (req, res) => {
    try {
      const { orders } = req.body;
      const orderValues = orders.map((o) => o.order);
      if (new Set(orderValues).size !== orders.length) {
        return res.status(400).json({ error: "Order values must be unique" });
      }
      const tempOps = orders.map(({ id }, idx) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order: idx + 1000 } },
        },
      }));
      await Category.bulkWrite(tempOps);
      const finalOps = orders.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order } },
        },
      }));
      await Category.bulkWrite(finalOps);
      res.json({ message: "Category orders updated successfully" });
    } catch (error) {
      console.error("Error updating category orders", error);
      res.status(500).json({
        error: `Failed to update category orders: ${error.message}`,
      });
    }
  }
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
      .notEmpty()
      .withMessage("Name cannot be empty if provided")
      .trim(),
    body("description").optional().trim(),
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
  async (req, res) => {
    try {
      const { name, description, order, requiredScore } = req.body;
      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (order) updateData.order = order;
      if (requiredScore) updateData.requiredScore = requiredScore;
      const category = await Category.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
        { new: true, runValidators: true }
      );
      if (!category)
        return res.status(404).json({ error: "Category not found" });
      res.json(category);
    } catch (error) {
      console.error("Error updating category", error);
      res
        .status(500)
        .json({ error: `Failed to update category: ${error.message}` });
    }
  }
);

//DELETE /api/categories/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  [param("id").isMongoId().withMessage("Invalid category ID")],
  validate,
  async (req, res) => {
    try {
      const category = await Category.findOneAndDelete({
        _id: req.params.id,
      });
      if (!category)
        return res.status(404).json({ error: "Category not found" });
      await Card.deleteMany({ categoryId: req.params.id });
      res.json({
        message: "Category deleted, related cards and words updated",
      });
    } catch (error) {
      console.error("Error deleting category", error);
      res
        .status(500)
        .json({ error: `Failed to delete category: ${error.message}` });
    }
  }
);

module.exports = router;
