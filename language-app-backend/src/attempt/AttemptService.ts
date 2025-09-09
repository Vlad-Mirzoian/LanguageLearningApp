import { v4 as uuidv4 } from "uuid";
import Attempt from "./Attempt";
import Card from "../card/Card";
import { IAttemptPopulated } from "./attempt.interface";
import { AttemptDTO } from "./attempt.dto";

interface AttemptData {
  attemptId?: string;
  userId: string;
  languageId: string;
  moduleId: string;
  levelId: string;
  type: "flash" | "test" | "dictation";
  score: number;
  isCorrect: boolean;
}

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

  static async viewAttempt(token: string): Promise<AttemptDTO> {
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
    const attemptDTO: AttemptDTO = {
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

  static async createOrUpdateAttempt(data: AttemptData): Promise<AttemptDTO> {
    const {
      attemptId,
      userId,
      languageId,
      moduleId,
      levelId,
      type,
      score,
      isCorrect,
    } = data;
    const finalQuality = isCorrect ? 5 : 0;

    let attempt = await Attempt.findOne({ attemptId, userId });
    if (!attempt) {
      attempt = await Attempt.create({
        attemptId: attemptId || uuidv4(),
        userId,
        languageId,
        moduleId,
        levelId,
        type,
        date: new Date(),
        score,
        correctAnswers: finalQuality === 5 ? 1 : 0,
        totalAnswers: 1,
      });
    } else {
      attempt.score += score;
      attempt.correctAnswers += finalQuality === 5 ? 1 : 0;
      attempt.totalAnswers += 1;
      await attempt.save();
    }

    const populatedAttempt = await Attempt.findById(attempt._id)
      .populate([
        { path: "userId", select: "username avatar" },
        { path: "languageId", select: "name" },
        { path: "moduleId", select: "name order requiredScore" },
        { path: "levelId", select: "order tasks requiredScore" },
      ])
      .lean<IAttemptPopulated>();

    if (!populatedAttempt) {
      throw new Error("Attempt not found after update");
    }

    return {
      id: populatedAttempt._id.toString(),
      user: {
        id: populatedAttempt.userId._id.toString(),
        username: populatedAttempt.userId.username,
        avatar: populatedAttempt.userId.avatar,
      },
      language: {
        id: populatedAttempt.languageId._id.toString(),
        name: populatedAttempt.languageId.name,
      },
      module: {
        id: populatedAttempt.moduleId._id.toString(),
        name: populatedAttempt.moduleId.name,
        order: populatedAttempt.moduleId.order,
      },
      level: {
        id: populatedAttempt.levelId._id.toString(),
        order: populatedAttempt.levelId.order,
        tasks: populatedAttempt.levelId.tasks,
      },
      type: populatedAttempt.type,
      date: populatedAttempt.date.toISOString(),
      score: populatedAttempt.score,
      correctAnswers: populatedAttempt.correctAnswers,
      totalAnswers: populatedAttempt.totalAnswers,
    };
  }
}
