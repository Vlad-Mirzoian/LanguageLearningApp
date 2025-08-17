const mongoose = require("mongoose");
const UserProgress = require("../models/UserProgress");

const leaderboardController = {
  async getLeaderboard(req, res) {
    try {
      const { languageId } = req.query;
      const progress = await UserProgress.aggregate([
        { $match: { languageId: new mongoose.Types.ObjectId(languageId) } },
        {
          $group: {
            _id: "$userId",
            maxScore: { $avg: "$maxScore" },
            totalScore: { $sum: "$maxScore" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $match: { "user.role": { $ne: "admin" } } },
        {
          $project: {
            userName: "$user.username",
            maxScore: 1,
            totalScore: 1,
          },
        },
        { $sort: { maxScore: -1 } },
        { $limit: 10 },
      ]);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  },
};

module.exports = leaderboardController;
