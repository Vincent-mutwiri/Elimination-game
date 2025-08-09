import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { Game } from './models/Game.js';
import { createGameManager } from './game.js';
import { connectDB } from './db.js';

const PORT = process.env.PORT || 4000;

// Simple CORS configuration that allows all origins in development
const corsOptions = {
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: '*',
  credentials: true,
  optionsSuccessStatus: 204
};

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);

// Configure Socket.IO with minimal CORS settings
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: '*',
    credentials: true
  },
  // Connection settings
  pingTimeout: 60000,       // 60 seconds without pong to consider connection dead
  pingInterval: 25000,      // Send pings every 25 seconds
  upgradeTimeout: 10000,    // Wait 10 seconds for the upgrade to complete
  maxHttpBufferSize: 1e8,   // 100MB max message size
  
  // Transport settings - try WebSocket first, then fall back to polling
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  
  // Security settings
  serveClient: false,
  cookie: false,
  
  // Disable per-message deflate to avoid compression issues
  perMessageDeflate: false
});

// Add connection state logging
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
    const topPlayers = await Game.aggregate([
      { $unwind: '$players' },
      { $match: { 'players.isAlive': false, 'winner': { $exists: true } } },
      { $group: { _id: '$players.name', wins: { $sum: 1 } } },
      { $sort: { wins: -1 } },
      { $limit: 10 }
    ]);
    res.json(topPlayers);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Socket.IO Handlers
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
      const result = await gm.startRound(payload);
      cb?.({ ok: true, ...result });
    } catch (e) {
      console.error('Error in host:startRound:', e);
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on('host:nextRound', async (payload, cb) => {
    try {
      const result = await gm.nextRound(payload);
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

// Start Server Function
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
