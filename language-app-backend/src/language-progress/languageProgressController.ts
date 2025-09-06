import { Request, Response } from "express";
import { LanguageProgressFiltersDTO } from "./language-progress.dto";
import { LanguageProgressService } from "./LanguageProgressService";

export const getLanguageProgress = async (
  req: Request<{}, {}, {}, LanguageProgressFiltersDTO>,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { modules, levels } =
      await LanguageProgressService.getLanguageProgress(req.userId, req.query);
    res.json({ modules: modules, levels: levels });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res
      .status(500)
      .json({ error: `Failed to fetch user progress: ${message}` });
  }
};
