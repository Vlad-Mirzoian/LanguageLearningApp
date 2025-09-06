import { Router } from "express";
import authRoutes from "../auth/authRoutes";
import attemptRoutes from "../attempt/attemptRoutes";
import cardRoutes from "../card/cardRoutes";
import languageRoutes from "../language/languageRoutes";
import languageProgressRoutes from "../language-progress/languageProgressRoutes";
import leaderboardRoutes from "../leaderboard/leaderboardRoutes";
import moduleRoutes from "../module/moduleRoutes";
import statsRoutes from "../stats/statsRoutes";
import wordRoutes from "../word/wordRoutes";
import userRoutes from "../user/userRoutes";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/attempts", attemptRoutes);
router.use("/cards", cardRoutes);
router.use("/languages", languageRoutes);
router.use("/language-progress", languageProgressRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/modules", moduleRoutes);
router.use("/stats", statsRoutes);
router.use("/words", wordRoutes);
router.use("/user", userRoutes);

export default router;
