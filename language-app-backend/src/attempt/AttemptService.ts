import { v4 as uuidv4 } from "uuid";
import Attempt from "./Attempt";
import { IAttemptPopulated } from "./attempt.interface";
import { AttemptPreviewDTO } from "./attempt.dto";

export class AttemptService {
  static async shareAttempt(
    attemptId: string,
    userId: string
  ): Promise<string> {
    const attempt = await Attempt.findOne({ attemptId: attemptId, userId });
    if (!attempt) {
      throw new Error("Attempt not found or access denied");
    }
    const shareToken = uuidv4();
    const shareTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    attempt.shareToken = shareToken;
    attempt.shareTokenExpires = shareTokenExpires;
    await attempt.save();
    const shareUrl = `${process.env.FRONTEND_URL}/attempts/view/${shareToken}`;
    return shareUrl;
  }

  static async viewAttempt(token: string): Promise<AttemptPreviewDTO> {
    const attempt = await Attempt.findOne({
      shareToken: token,
    })
      .populate("userId", "username avatar")
      .populate("languageId", "name")
      .populate("moduleId", "name order")
      .populate("levelId", "order tasks")
      .lean<IAttemptPopulated>();
    if (!attempt) {
      throw new Error("Shared attempt not found");
    }
    const attemptDTO: AttemptPreviewDTO = {
      id: attempt._id.toString(),
      user: {
        id: attempt.userId._id,
        username: attempt.userId.username,
        avatar: attempt.userId.avatar,
      },
      language: {
        id: attempt.languageId._id.toString(),
        name: attempt.languageId.name,
      },
      module: {
        id: attempt.moduleId._id.toString(),
        name: attempt.moduleId.name,
        order: attempt.moduleId.order,
      },
      level: {
        id: attempt.levelId._id.toString(),
        order: attempt.levelId.order,
        tasks: attempt.levelId.tasks,
      },
      type: attempt.type,
      date: attempt.date.toISOString(),
      score: attempt.score,
      correctAnswers: attempt.correctAnswers,
      totalAnswers: attempt.totalAnswers,
    };
    return attemptDTO;
  }
}
