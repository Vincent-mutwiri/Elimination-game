import { Router } from 'express';
import { Game } from '../models/Game.js';

const router = Router();

router.get('/games', async (_req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 }).limit(50);
    res.json(games);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch games', message: e.message });
  }
});

router.get('/games/:code', async (req, res) => {
  try {
    const game = await Game.findOne({ code: req.params.code });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch game', message: e.message });
  }
});

router.get('/leaderboard', async (_req, res) => {
  try {
    const topPlayers = await Game.aggregate([
      { $match: { winner: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$winner.name',
          wins: { $sum: 1 },
          playerId: { $first: '$winner.id' },
        },
      },
      { $sort: { wins: -1 } },
      { $limit: 10 },
      { $project: { name: '$_id', wins: 1, playerId: 1, _id: 0 } },
    ]);
    res.json(topPlayers);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch leaderboard', message: e.message });
  }
});

export default router;
