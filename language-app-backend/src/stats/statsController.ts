import { Request, Response } from "express";
import { StatsService } from "./StatsService";

export const getStats = async (
  req: Request<{}, {}, {}, { languageId: string }>,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { summary, statsByType, statsByModule, statsByLevel, attempts } =
      await StatsService.getStats(req.userId, req.query.languageId);
    res.json({
      summary,
      statsByType,
      statsByModule,
      statsByLevel,
      attempts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch statistics: ${message}` });
  }
};
