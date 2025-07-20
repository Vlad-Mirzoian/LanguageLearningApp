const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Word = require("../models/Word");
const Category = require("../models/Category");
const { authenticate, authorizeRoles } = require("../middleware/auth");

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
  async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const category = new Category({ name, description });
      await category.save();
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category", error);
      res
        .status(400)
        .json({ error: `Failed to create category: ${error.message}` });
    }
  }
);

// PUT /api/categories/:id
router.put(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const updateData = { name };
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
        .status(400)
        .json({ error: `Failed to update category: ${error.message}` });
    }
  }
);

//DELETE /api/categories/:id
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(["admin"]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const category = await Category.findOneAndDelete({
        _id: req.params.id,
      });
      if (!category)
        return res.status(404).json({ error: "Category not found" });
      await Word.updateMany(
        { categoryId: req.params.id },
        { $set: { categoryId: null } }
      );
      res.json({
        message: "Category deleted, related cards and words updated",
      });
    } catch (error) {
      console.error("Error deleting category", error);
      res
        .status(400)
        .json({ error: `Failed to delete category: ${error.message}` });
    }
  }
);

module.exports = router;