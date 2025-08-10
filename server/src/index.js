import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { Game } from './models/Game.js';
import { Question } from './models/Question.js';
import { createGameManager } from './game.js';
import { connectDB } from './db.js';

const PORT = process.env.PORT || 4000;

const corsOptions = {
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
  credentials: true,
  optionsSuccessStatus: 204
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: '*',
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e8,
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  serveClient: false,
  cookie: false,
  perMessageDeflate: false
});

io.engine.on('connection_error', (err) => {
  console.error('Socket.IO connection error:', err);
});

io.engine.on('upgrade_error', (err) => {
  console.error('Socket.IO upgrade error:', err);
});

io.engine.on('upgrade', (req, socket, head) => {
  console.log('Socket.IO upgrade requested from:', req.headers.origin);
});

const gm = createGameManager(io);

// API Routes
app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/api/games', async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 }).limit(50);
    res.json(games);
  } catch (e) {
    console.error('Error in /api/games:', e);
    res.status(500).json({ error: 'Failed to fetch games', message: e.message });
  }
});

app.get('/api/games/:code', async (req, res) => {
  try {
    const game = await Game.findOne({ code: req.params.code });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (e) {
    console.error(`Error in /api/games/${req.params.code}:`, e);
    res.status(500).json({ error: 'Failed to fetch game', message: e.message });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    console.log('Fetching leaderboard...');
    const topPlayers = await Game.aggregate([
      // First, filter games that have a winner
      { $match: { 'winner': { $exists: true, $ne: null } } },
      // Group by winner's name and count wins
      { 
        $group: { 
          _id: '$winner.name', 
          wins: { $sum: 1 },
          // Optionally include the winner's ID if available
          playerId: { $first: '$winner.id' }
        } 
      },
      // Sort by number of wins in descending order
      { $sort: { wins: -1 } },
      // Limit to top 10
      { $limit: 10 },
      // Project to clean up the output
      {
        $project: {
          name: '$_id',
          wins: 1,
          playerId: 1,
          _id: 0
        }
      }
    ]);
    
    console.log('Leaderboard results:', topPlayers);
    res.json(topPlayers);
  } catch (e) {
    console.error('Error in /api/leaderboard:', e);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      message: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
});

app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.post('/api/questions', async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create question' });
  }
});

app.put('/api/questions/:id', async (req, res) => {
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedQuestion);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

app.delete('/api/questions/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('host:createGame', async (payload, cb) => {
    try {
      const game = await gm.createGame(payload);
      socket.join(game.code);
      await gm.attachSocketToGame(socket, game.code, { isHost: true });
      cb?.({ ok: true, game });
    } catch (e) {
      console.error('Error in host:createGame:', e);
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on('host:startRound', async (payload, cb) => {
    try {
      const result = await gm.startRound(payload, socket.id);
      cb?.({ ok: true, ...result });
    } catch (e) {
      console.error('Error in host:startRound:', e);
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on('host:nextRound', async (payload, cb) => {
    try {
      const result = await gm.nextRound(payload, socket.id);
      cb?.({ ok: true, ...result });
    } catch (e) {
      console.error('Error in host:nextRound:', e);
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on('host:endGame', async ({ code }, cb) => {
    try {
      await gm.endGame(code);
      cb?.({ ok: true });
    } catch (e) {
      console.error('Error in host:endGame:', e);
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on('player:join', async ({ code, name }, cb) => {
    try {
      const { player, game } = await gm.addPlayer(code, { name, socketId: socket.id });
      socket.join(code);
      await gm.attachSocketToGame(socket, code, { isHost: false });
      cb?.({ ok: true, player, game });
    } catch (e) {
      console.error('Error in player:join:', e);
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on('player:answer', async (payload, cb) => {
    try {
      const res = await gm.recordAnswer(payload, socket.id);
      cb?.({ ok: true, ...res });
    } catch (e) {
      console.error('Error in player:answer:', e);
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on('player:usePowerUp', async ({ code, powerUpName }, cb) => {
    try {
      const result = await gm.usePowerUp(code, socket.id, powerUpName);
      cb?.({ ok: true, ...result });
    } catch (e) {
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on('player:sendEmote', ({ code, emote }) => {
    io.to(code).emit('game:emote', {
      playerId: socket.id,
      emote: emote,
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    gm.handleDisconnect(socket.id);
  });
});

async function startServer() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
