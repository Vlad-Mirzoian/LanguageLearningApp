const Card = require("../models/Card");
const Language = require("../models/Language");
const Module = require("../models/Module");
const User = require("../models/User");

const moduleController = {
  async getModules(req, res) {
    try {
      const { languageId, name, limit = 20, skip = 0 } = req.query;
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (languageId) {
        const language = await Language.findById(languageId).lean();
        if (!language) {
          return res.status(404).json({ error: "Language not found" });
        }
      }

      const query = {};
      if (languageId) query.languageId = languageId;
      if (name) query.name = { $regex: name, $options: "i" };

      const [modules, total] = await Promise.all([
        Module.find(query)
          .populate("languageId", "name code")
          .sort({ order: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Module.countDocuments(query),
      ]);

      res.json({ modules, total });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch modules: ${error.message}` });
    }
  },

  async createModule(req, res) {
    try {
      const { name, description, order, requiredScore, languageId } = req.body;
      const [existingOrder, language] = await Promise.all([
        Module.findOne({ order }).lean(),
        Language.findById(languageId).lean(),
      ]);
      if (existingOrder) {
        return res.status(400).json({ error: "Order value is already taken" });
      }
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
      const module = new Module({
        name,
        description,
        order,
        requiredScore,
        languageId,
        wordsCount: 0,
      });
      await module.save();
      res.status(201).json(module);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to create module: ${error.message}` });
    }
  },

  async updateModuleOrders(req, res) {
    try {
      const { orders } = req.body;
      const orderValues = orders.map((o) => o.order);
      if (new Set(orderValues).size !== orders.length) {
        return res.status(400).json({ error: "Order values must be unique" });
      }
      const modules = await Module.find({
        _id: { $in: orders.map((o) => o.id) },
      }).lean();
      if (modules.length !== orders.length) {
        return res
          .status(400)
          .json({ error: "One or more module IDs not found" });
      }
      const languageIds = new Set(modules.map((m) => m.languageId.toString()));
      if (languageIds.size > 1) {
        return res
          .status(400)
          .json({ error: "All modules must belong to the same language" });
      }
      const tempOps = orders.map(({ id }, idx) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order: idx + 1000 } },
        },
      }));
      await Module.bulkWrite(tempOps);
      const finalOps = orders.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order } },
        },
      }));
      await Module.bulkWrite(finalOps);
      res.json({ message: "Module orders updated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to update module orders: ${error.message}` });
    }
  },

  async updateModule(req, res) {
    try {
      const { name, description, order, requiredScore, languageId } = req.body;
      if (languageId) {
        const language = await Module.findById(languageId).lean();
        if (!language) {
          return res.status(404).json({ error: "Language not found" });
        }
      }
      if (order && languageId) {
        const existingOrder = await Module.findOne({
          order,
          languageId,
          _id: { $ne: req.params.id },
        }).lean();
        if (existingOrder) {
          return res
            .status(400)
            .json({ error: "Order value is already taken for this language" });
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (order) updateData.order = order;
      if (requiredScore !== undefined) updateData.requiredScore = requiredScore;
      if (languageId) updateData.languageId = languageId;

      const module = await Module.findOneAndUpdate(
        { _id: req.params.id },
        updateData,
        { new: true, runValidators: true, lean: true }
      );
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to update module: ${error.message}` });
    }
  },

  async deleteModule(req, res) {
    try {
      const module = await Module.findOneAndDelete({
        _id: req.params.id,
      }).lean();
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      await Promise.all([
        Card.deleteMany({ moduleId: req.params.id }),
        Level.deleteMany({ moduleId: req.params.id }),
      ]);
      res.json({
        message: "Module and associated levels deleted successfully",
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to delete module: ${error.message}` });
    }
  },
};

module.exports = moduleController;
