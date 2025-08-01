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
    const categories = await Category.find();
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
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const category = new Category({ name, description });
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
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
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
