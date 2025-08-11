const Card = require("../models/Card");
const Category = require("../models/Category");

const categoryController = {
  async getCategories(req, res) {
    try {
      const categories = await Category.find().sort({ order: 1 }).lean();
      res.json(categories);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch categories: ${error.message}` });
    }
  },

  async createCategory(req, res) {
    try {
      const { name, description, order, requiredScore } = req.body;
      const existingOrder = await Category.findOne({ order }).lean();
      if (existingOrder) {
        return res.status(400).json({ error: "Order value is already taken" });
      }
      const category = new Category({
        name,
        description,
        order,
        requiredScore,
      });
      await category.save();
      res.status(201).json(category);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to create category: ${error.message}` });
    }
  },

  async updateCategoryOrders(req, res) {
    try {
      const { orders } = req.body;
      const orderValues = orders.map((o) => o.order);
      if (new Set(orderValues).size !== orders.length) {
        return res.status(400).json({ error: "Order values must be unique" });
      }
      const categories = await Category.find({
        _id: { $in: orders.map((o) => o.id) },
      }).lean();
      if (categories.length !== orders.length) {
        return res
          .status(400)
          .json({ error: "One or more category IDs not found" });
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
      res
        .status(500)
        .json({ error: `Failed to update category orders: ${error.message}` });
    }
  },

  async updateCategory(req, res) {
    try {
      const { name, description, order, requiredScore } = req.body;
      if (order) {
        const existingOrder = await Category.findOne({
          order,
          _id: { $ne: req.params.id },
        }).lean();
        if (existingOrder) {
          return res
            .status(400)
            .json({ error: "Order value is already taken" });
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (order) updateData.order = order;
      if (requiredScore !== undefined) updateData.requiredScore = requiredScore;

      const category = await Category.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
        { new: true, runValidators: true, lean: true }
      );
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to update category: ${error.message}` });
    }
  },

  async deleteCategory(req, res) {
    try {
      const category = await Category.findOneAndDelete({
        _id: req.params.id,
      }).lean();
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      await Card.deleteMany({ categoryId: req.params.id });
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to delete category: ${error.message}` });
    }
  },
};

module.exports = categoryController;
