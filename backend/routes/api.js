const express = require("express");
const router = express.Router();
const authRoutes = require("./authRoutes");
const attemptRoutes = require("./attemptRoutes");
const cardRoutes = require("./cardRoutes");
const categoryRoutes = require("./categoryRoutes");
const languageRoutes = require("./languageRoutes");
const leaderboardRoutes = require("./leaderboardRoutes");
const statsRoutes = require("./statsRoutes");
const userProgressRoutes = require("./userProgressRoutes");
const wordRoutes = require("./wordRoutes");

router.use("/attempts", attemptRoutes);
router.use("/auth", authRoutes);
router.use("/cards", cardRoutes);
router.use("/categories", categoryRoutes);
router.use("/languages", languageRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/stats", statsRoutes);
router.use("/user-progress", userProgressRoutes);
router.use("/words", wordRoutes);

module.exports = router;
