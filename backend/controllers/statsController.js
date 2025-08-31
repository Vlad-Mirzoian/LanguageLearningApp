const Attempt = require("../models/Attempt");
const ModuleProgress = require("../models/ModuleProgress");
const Language = require("../models/Language");
const LevelProgress = require("../models/LevelProgress");
const User = require("../models/User");

const statsController = {
  async getStats(req, res) {
    try {
      const { languageId } = req.query;
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
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

      const moduleProgressQuery = { userId: req.userId, languageId };
      const levelProgressQuery = { userId: req.userId, languageId };
      const attemptQuery = { userId: req.userId, languageId };

      const [moduleProgress, levelProgress, attempts] = await Promise.all([
        ModuleProgress.find(moduleProgressQuery)
          .populate({
            path: "moduleId",
            select: "name order requiredScore",
          })
          .lean(),
        LevelProgress.find(levelProgressQuery)
          .populate({
            path: "levelId",
            select: "order tasks requiredScore pointsReward",
          })
          .populate({
            path: "moduleId",
            select: "name",
          })
          .lean(),
        Attempt.find(attemptQuery)
          .populate({
            path: "userId",
            select: "username avatar",
          })
          .populate({
            path: "languageId",
            select: "name",
          })
          .populate({
            path: "moduleId",
            select: "name order",
          })
          .populate({
            path: "levelId",
            select: "order tasks",
          })
          .lean(),
      ]);

      const statsByType = attempts.reduce((acc, attempt) => {
        if (!acc[attempt.type]) {
          acc[attempt.type] = {
            correctAnswers: 0,
            totalAnswers: 0,
            attempts: 0,
          };
        }
        acc[attempt.type].correctAnswers += attempt.correctAnswers;
        acc[attempt.type].totalAnswers += attempt.totalAnswers;
        acc[attempt.type].attempts += 1;
        return acc;
      }, {});

      const statsByModule = moduleProgress.reduce((acc, progress) => {
        const moduleAttempts = attempts.filter(
          (a) =>
            a.moduleId &&
            a.moduleId._id.toString() === progress.moduleId._id.toString()
        );
        acc[progress.moduleId._id.toString()] = {
          moduleName: progress.moduleId.name,
          order: progress.moduleId.order,
          totalScore: progress.totalScore,
          completedLevels: progress.completedLevels,
          totalLevels: progress.totalLevels,
          achievements: progress.achievements,
          attemptCount: moduleAttempts.length,
          avgAttemptScore: moduleAttempts.length
            ? moduleAttempts.reduce((sum, a) => sum + a.score, 0) /
              moduleAttempts.length
            : 0,
          avgCorrectPercentage: moduleAttempts.length
            ? (moduleAttempts.reduce(
                (sum, a) => sum + a.correctAnswers / (a.totalAnswers || 1),
                0
              ) /
                moduleAttempts.length) *
              100
            : 0,
        };
        return acc;
      }, {});

      const statsByLevel = levelProgress.reduce((acc, progress) => {
        const levelAttempts = attempts.filter(
          (a) =>
            a.levelId &&
            a.levelId._id.toString() === progress.levelId._id.toString()
        );
        acc[progress.levelId._id.toString()] = {
          moduleName: progress.moduleId.name,
          levelOrder: progress.levelId.order,
          task: progress.levelId.tasks,
          bestScore: progress.bestScore,
          unlocked: progress.unlocked,
          attemptCount: levelAttempts.length,
          avgAttemptScore: levelAttempts.length
            ? levelAttempts.reduce((sum, a) => sum + a.score, 0) /
              levelAttempts.length
            : 0,
          avgCorrectPercentage: levelAttempts.length
            ? (levelAttempts.reduce(
                (sum, a) => sum + a.correctAnswers / (a.totalAnswers || 1),
                0
              ) /
                levelAttempts.length) *
              100
            : 0,
        };
        return acc;
      }, {});

      const summary = {
        totalModules: moduleProgress.length,
        completedModules: moduleProgress.filter((p) => p.unlocked).length,
        totalLevels: levelProgress.length,
        completedLevels: levelProgress.filter((p) => p.unlocked).length,
        totalAchievements: moduleProgress.reduce(
          (sum, p) => sum + p.achievements.length,
          0
        ),
      };

      res.json({
        summary,
        statsByType,
        statsByModule,
        statsByLevel,
        attempts,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch statistics: ${error.message}` });
    }
  },
};

module.exports = statsController;
