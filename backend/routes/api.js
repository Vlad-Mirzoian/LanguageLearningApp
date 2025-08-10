const express = require("express");
const router = express.Router();
const authRoutes = require("./auth");
const languageRoutes = require("./languages");
const categoryRoutes = require("./categories");
const wordRoutes = require("./words");
const cardRoutes = require("./cards");
const userProgressRoutes = require("./user-progress");

router.use("/auth", authRoutes);
router.use("/languages", languageRoutes);
router.use("/categories", categoryRoutes);
router.use("/words", wordRoutes);
router.use("/cards", cardRoutes);
router.use("/user-progress", userProgressRoutes);

module.exports = router;
