import mongoose from "mongoose";
import ModuleProgress from "../language-progress/ModuleProgress";
import Language from "../language/Language";
import Attempt from "../attempt/Attempt";
import { LeaderboardEntryDTO } from "./leaderboard.dto";

export class LeaderboardService {
  static async getLeaderboard(
    languageId: string
  ): Promise<LeaderboardEntryDTO[]> {
    const language = await Language.findById(languageId).lean();
    if (!language) {
      throw new Error("Language not found");
    }

    const moduleProgressAggregation = await ModuleProgress.aggregate([
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
          totalScore: { $sum: "$totalScore" },
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
    const leaderboard: LeaderboardEntryDTO[] = moduleProgressAggregation
      .map((p) => {
        const attempt = attemptMap.get(String(p._id)) || {};
        return {
          username: p.username,
          totalScore: p.totalScore || 0,
          avgAttemptScore: attempt.avgAttemptScore || 0,
          avgCorrectPercentage: (attempt.avgCorrectPercentage || 0) * 100,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);
    return leaderboard;
  }
}
