const Module = require("../models/Module");
const ModuleProgress = require("../models/ModuleProgress");
const Language = require("../models/Language");
const LevelProgress = require("../models/LevelProgress");
const User = require("../models/User");

const languageProgressController = {
  async getLanguageProgress(req, res) {
    try {
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { languageId, moduleId } = req.query;
      if (languageId) {
        const language = await Language.findById(languageId).lean();
        if (!language) {
          return res.status(404).json({ error: "Language not found" });
        }
        if (
          !user.nativeLanguageId.equals(languageId) &&
          !user.learningLanguagesIds.some((id) => id.equals(languageId))
        ) {
          return res
            .status(403)
            .json({ error: "Access to this language is restricted" });
        }
      }
      if (moduleId) {
        const module = await Module.findById(moduleId).lean();
        if (!module) {
          return res.status(404).json({ error: "Module not found" });
        }
      }

      const moduleProgressQuery = { userId: req.userId };
      if (languageId) moduleProgressQuery.languageId = languageId;
      if (moduleId) moduleProgressQuery.moduleId = moduleId;

      const levelProgressQuery = { userId: req.userId };
      if (languageId) levelProgressQuery.languageId = languageId;
      if (moduleId) levelProgressQuery.moduleId = moduleId;

      const [modulesRaw, levelsRaw] = await Promise.all([
        ModuleProgress.find(moduleProgressQuery)
          .populate({ path: "moduleId", select: "name order requiredScore" })
          .lean(),
        LevelProgress.find(levelProgressQuery)
          .populate({ path: "levelId", select: "order tasks requiredScore" })
          .lean(),
      ]);

      const levels = levelsRaw.map((lp) => ({
        _id: lp._id.toString(),
        userId: lp.userId.toString(),
        languageId: lp.languageId.toString(),
        moduleId: lp.moduleId.toString(),
        levelId: lp.levelId,
        bestScore: lp.bestScore,
        unlocked: lp.unlocked,
      }));

      const modules = modulesRaw.map((mp) => ({
        _id: mp._id.toString(),
        userId: mp.userId.toString(),
        languageId: mp.languageId.toString(),
        moduleId: mp.moduleId,
        totalLevels: mp.totalLevels,
        completedLevels: mp.completedLevels,
        totalScore: mp.totalScore,
        unlocked: mp.unlocked,
      }));

      res.json({ modules, levels });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch user progress: ${error.message}` });
    }
  },
};

module.exports = languageProgressController;
