const express = require('express');
const router = express.Router();
const Card = require('../models/Card');

// POST /api/cards
router.post('/cards', async (req, res) => {
  try {
    const { userId, word, translation, category } = req.body;
    if (!userId || !word || !translation) {
      return res.status(400).json({ error: 'userId, word, and translation are required' });
    }
    const card = new Card({ userId, word, translation, category });
    await card.save();
    res.status(201).json(card);
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(400).json({ error: `Failed to create card: ${error.message}` });
  }
});

module.exports = router;