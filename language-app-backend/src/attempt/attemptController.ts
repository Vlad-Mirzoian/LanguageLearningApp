import { Request, Response } from "express";
import { AttemptService } from "./AttemptService";

export const shareAttempt = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const shareUrl = await AttemptService.shareAttempt(id, req.userId);
    res.json({ url: shareUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to share attempt link: ${message}` });
  }
};

export const viewAttempt = async (
  req: Request<{ token: string }>,
  res: Response
) => {
  try {
    const { token } = req.params;
    const attempt = await AttemptService.viewAttempt(token);
    res.json(attempt);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to view attempt data: ${message}` });
  }
};
