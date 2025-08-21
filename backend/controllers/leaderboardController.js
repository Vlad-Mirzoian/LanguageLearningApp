const mongoose = require("mongoose");
const UserProgress = require("../models/UserProgress");
const Attempt = require("../models/Attempt");

const leaderboardController = {
  async getLeaderboard(req, res) {
    try {
      const { languageId } = req.query;
      const progressAggregation = await UserProgress.aggregate([
        {
          $match: {
            languageId: mongoose.Types.ObjectId.createFromHexString(languageId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $match: { "user.role": { $ne: "admin" } } },
        {
          $group: {
            _id: "$userId",
            username: { $first: "$user.username" },
            totalScore: { $sum: "$maxScore" },
          },
        },
      ]);
      const attemptAggregation = await Attempt.aggregate([
        {
          $match: {
            languageId: mongoose.Types.ObjectId.createFromHexString(languageId),
          },
        },
        {
          $group: {
            _id: "$userId",
            avgAttemptScore: { $avg: "$score" },
            avgCorrectPercentage: {
              $avg: {
                $cond: [
                  { $gt: ["$totalAnswers", 0] },
                  { $divide: ["$correctAnswers", "$totalAnswers"] },
                  0,
                ],
              },
            },
          },
        },
      ]);

      const attemptMap = new Map(
        attemptAggregation.map((a) => [String(a._id), a])
      );
      const leaderboard = progressAggregation
        .map((p) => {
          const attempt = attemptMap.get(String(p._id)) || {};
          return {
            username: p.username,
            totalScore: p.totalScore,
            avgAttemptScore: attempt.avgAttemptScore || 0,
            avgCorrectPercentage: (attempt.avgCorrectPercentage || 0) * 100,
          };
        })
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 10);
      res.json(leaderboard);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to fetch leaderboard: ${error.message}` });
    }
  },
};

module.exports = leaderboardController;
