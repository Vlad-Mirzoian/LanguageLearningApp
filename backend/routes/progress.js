const express = require("express");
const router = express.Router();
const Card = require("../models/Card");
const User = require("../models/User");
const Word = require("../models/Word");
const { authenticate, authorizeRoles } = require("../middleware/auth");

// GET /api/progress
router.get("/", authenticate, authorizeRoles(["user"]), async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate(
      "nativeLanguageId learningLanguagesIds"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const totalCards = await Card.countDocuments({
      $and: [
        {
          wordId: {
            $in: await Word.find({
              languageId: user.nativeLanguageId._id,
            }).distinct("_id"),
          },
        },
        {
          translationId: {
            $in: await Word.find({
              languageId: {
                $in: user.learningLanguagesIds.map((lang) => lang._id),
              },
            }).distinct("_id"),
          },
        },
      ],
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const reviewedToday = await Card.countDocuments({
      lastReviewed: { $gte: startOfDay },
      $and: [
        {
          wordId: {
            $in: await Word.find({
              languageId: user.nativeLanguageId._id,
            }).distinct("_id"),
          },
        },
        {
          translationId: {
            $in: await Word.find({
              languageId: {
                $in: user.learningLanguagesIds.map((lang) => lang._id),
              },
            }).distinct("_id"),
          },
        },
      ],
    });

    const learnedCards = await Card.countDocuments({
      repetitions: { $gte: 5 },
      $and: [
        {
          wordId: {
            $in: await Word.find({
              languageId: user.nativeLanguageId._id,
            }).distinct("_id"),
          },
        },
        {
          translationId: {
            $in: await Word.find({
              languageId: {
                $in: user.learningLanguagesIds.map((lang) => lang._id),
              },
            }).distinct("_id"),
          },
        },
      ],
    });

    // Cards by language
    const languagesStats = await Card.aggregate([
      {
        $match: {
          $and: [
            {
              wordId: {
                $in: await Word.find({
                  languageId: user.nativeLanguageId._id,
                }).distinct("_id"),
              },
            },
            {
              translationId: {
                $in: await Word.find({
                  languageId: {
                    $in: user.learningLanguagesIds.map((lang) => lang._id),
                  },
                }).distinct("_id"),
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "words",
          localField: "wordId",
          foreignField: "_id",
          as: "word",
        },
      },
      { $unwind: "$word" },
      {
        $lookup: {
          from: "words",
          localField: "translationId",
          foreignField: "_id",
          as: "translation",
        },
      },
      { $unwind: "$translation" },
      {
        $lookup: {
          from: "languages",
          localField: "word.languageId",
          foreignField: "_id",
          as: "nativeLang",
        },
      },
      { $unwind: "$nativeLang" },
      {
        $lookup: {
          from: "languages",
          localField: "translation.languageId",
          foreignField: "_id",
          as: "learningLang",
        },
      },
      { $unwind: "$learningLang" },
      {
        $group: {
          _id: {
            nativeLanguageId: "$nativeLang._id",
            learningLanguagesIds: "$learningLang._id",
          },
          nativeLanguageName: { $first: "$nativeLang.name" },
          learningLanguageName: { $first: "$learningLang.name" },
          total: { $sum: 1 },
          learned: { $sum: { $cond: [{ $gte: ["$repetitions", 5] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          nativeLanguageId: {
            id: "$_id.nativeLanguageId",
            name: "$nativeLanguageName",
          },
          learningLanguagesIds: {
            id: "$_id.learningLanguageIds",
            name: "$learningLanguageName",
          },
          total: 1,
          learned: 1,
        },
      },
    ]);

    // Category stats (based on Word.categoryId for wordId and translationId)
    const categoriesStats = await Card.aggregate([
      {
        $match: {
          $and: [
            {
              wordId: {
                $in: await Word.find({
                  languageId: user.nativeLanguageId._id,
                }).distinct("_id"),
              },
            },
            {
              translationId: {
                $in: await Word.find({
                  languageId: {
                    $in: user.learningLanguagesIds.map((lang) => lang._id),
                  },
                }).distinct("_id"),
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$categoryId",
          categoryName: {
            $first: { $ifNull: ["$category.name", "Uncategorized"] },
          },
          total: { $sum: 1 },
          learned: { $sum: { $cond: [{ $gte: ["$repetitions", 5] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          category: {
            id: "$_id",
            name: "$categoryName",
          },
          total: 1,
          learned: 1,
        },
      },
    ]);

    res.json({
      totalCards,
      reviewedToday,
      learnedCards,
      languagesStats,
      categoriesStats,
    });
  } catch (error) {
    console.error("Error fetching progress", error);
    res
      .status(500)
      .json({ error: `Failed to fetch progress: ${error.message}` });
  }
});

module.exports = router;
