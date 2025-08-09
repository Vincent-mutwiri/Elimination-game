import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { createGameManager } from './game.js';

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN, methods: ['GET','POST'] }
});

const gm = createGameManager(io);

// HTTP health check
app.get('/health', (_, res) => res.json({ ok: true }));

// Admin API endpoints
app.get('/api/games', async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 }).limit(50);
    res.json(games);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

app.get('/api/games/:code', async (req, res) => {
  try {
    const game = await Game.findOne({ code: req.params.code });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

io.on('connection', (socket) => {
  // Host creates game
  socket.on('host:createGame', (payload, cb) => {
    try {
      const game = gm.createGame(payload);
      socket.join(game.code);
      gm.attachSocketToGame(socket, game.code, { isHost: true });
      cb?.({ ok: true, game });
    } catch (e) {
      cb?.({ ok: false, error: e.message });
    }
  });

  // Host actions
  socket.on('host:startRound', (payload, cb) => {
    try {
      const result = gm.startRound(payload);
      cb?.({ ok: true, ...result });
    } catch (e) {
      cb?.({ ok: false, error: e.message });
    }
  });
  socket.on('host:nextRound', (payload, cb) => {
    try {
      const result = gm.nextRound(payload);
      cb?.({ ok: true, ...result });
    } catch (e) {
      cb?.({ ok: false, error: e.message });
    }
  });
  socket.on('host:endGame', ({ code }, cb) => {
    try {
      gm.endGame(code);
      cb?.({ ok: true });
    } catch (e) {
      cb?.({ ok: false, error: e.message });
    }
  });

  // Player joins & answers
  socket.on('player:join', ({ code, name }, cb) => {
    try {
      const player = gm.addPlayer(code, { name, socketId: socket.id });
      socket.join(code);
      gm.attachSocketToGame(socket, code, { isHost: false });
      cb?.({ ok: true, player, game: gm.publicGame(code) });
    } catch (e) {
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on('player:answer', (payload, cb) => {
    try {
      const res = gm.recordAnswer(payload, socket.id);
      cb?.({ ok: true, ...res });
    } catch (e) {
      cb?.({ ok: false, error: e.message });
    }
  });

  socket.on('disconnect', () => {
    gm.handleDisconnect(socket.id);
  });
});

  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
