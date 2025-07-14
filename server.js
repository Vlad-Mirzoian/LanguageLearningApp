const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/language-learning', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.json({ message: 'Language Learning API is running' });
});

// POST /api/cards
app.post('/api/cards', async (req, res) => {
  try {
    const { userId, word, translation, category } = req.body;
    const card = new Card({ userId, word, translation, category });
    await card.save();
    res.status(201).json(card);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create card' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
