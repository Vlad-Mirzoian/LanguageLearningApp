import { Request, Response } from "express";
import { LeaderboardService } from "./LeaderboardService";

export const getLeaderboard = async (
  req: Request<{}, {}, {}, { languageId: string }>,
  res: Response
) => {
  try {
    const leaderboard = await LeaderboardService.getLeaderboard(
      req.query.languageId
    );
    res.json(leaderboard);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch leaderboard: ${message}` });
  }
};

