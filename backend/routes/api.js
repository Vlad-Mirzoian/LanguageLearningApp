const express = require("express");
const router = express.Router();
const authRoutes = require("./authRoutes");
const attemptRoutes = require("./attemptRoutes");
const cardRoutes = require("./cardRoutes");
const moduleRoutes = require("./moduleRoutes");
const languageRoutes = require("./languageRoutes");
const leaderboardRoutes = require("./leaderboardRoutes");
const statsRoutes = require("./statsRoutes");
const languageProgressRoutes = require("./languageProgressRoutes");
const wordRoutes = require("./wordRoutes");

router.use("/attempts", attemptRoutes);
router.use("/auth", authRoutes);
router.use("/cards", cardRoutes);
router.use("/modules", moduleRoutes);
router.use("/languages", languageRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/stats", statsRoutes);
router.use("/language-progress", languageProgressRoutes);
router.use("/words", wordRoutes);

module.exports = router;
