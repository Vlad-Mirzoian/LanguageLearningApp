const express = require("express");
const router = express.Router();
const authRoutes = require("./authRoutes");
const cardRoutes = require("./cardRoutes");
const categoryRoutes = require("./categoryRoutes");
const languageRoutes = require("./languageRoutes");
const userProgressRoutes = require("./userProgressRoutes");
const wordRoutes = require("./wordController");

router.use("/auth", authRoutes);
router.use("/languages", languageRoutes);
router.use("/categories", categoryRoutes);
router.use("/words", wordRoutes);
router.use("/cards", cardRoutes);
router.use("/user-progress", userProgressRoutes);

module.exports = router;
