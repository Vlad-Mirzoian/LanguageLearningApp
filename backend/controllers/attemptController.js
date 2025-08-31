const { v4: uuidv4 } = require("uuid");
const Attempt = require("../models/Attempt");

const attemptController = {
  async shareAttempt(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const attempt = await Attempt.findOne({ attemptId: id, userId });
      if (!attempt) {
        return res
          .status(404)
          .json({ error: "Attempt not found or access denied" });
      }
      const shareToken = uuidv4();
      const shareTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      attempt.shareToken = shareToken;
      attempt.shareTokenExpires = shareTokenExpires;
      await attempt.save();
      const shareUrl = `${process.env.FRONTEND_URL}/attempts/view/${shareToken}`;
      res.json(shareUrl);
    } catch (error) {
      res.status(500).json({ error: "Failed to share attempt link" });
    }
  },

  async viewAttempt(req, res) {
    try {
      const { token } = req.params;
      const attempt = await Attempt.findOne({
        shareToken: token,
      })
        .populate("userId", "username avatar")
        .populate("languageId", "name")
        .populate("moduleId", "name");
      if (!attempt) {
        res.status(404).json({ error: "Shared attempt not found" });
      }
      res.json(attempt);
    } catch (error) {
      res.status(500).json({ error: "Failed to view attempt data" });
    }
  },
};

module.exports = attemptController;
