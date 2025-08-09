import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { createGameManager } from './game.js';
import { connectDB } from './db.js';
import { Game } from './models/Game.js';

const PORT = process.env.PORT || 4000;
// Parse CORS_ORIGIN as an array if it contains commas, otherwise use as a single string
const CORS_ORIGIN = process.env.CORS_ORIGIN?.includes(',') 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or WebSocket connections)
    if (!origin) return callback(null, true);
    
    // Remove protocol and port for more flexible matching
    const originHost = origin.replace(/^https?:\/\//, '').split(':')[0];
    
    if (Array.isArray(CORS_ORIGIN)) {
      // Check if the origin is in the allowed list
      const allowedOrigins = CORS_ORIGIN.map(o => o.replace(/^https?:\/\//, '').split(':')[0]);
      if (allowedOrigins.includes(originHost) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    } else if (origin === CORS_ORIGIN || 
               origin.replace(/^https?:\/\//, '').split(':')[0] === CORS_ORIGIN.replace(/^https?:\/\//, '').split(':')[0]) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow all origins in development, or specific origins in production
      if (process.env.NODE_ENV === 'development' || !origin) {
        return callback(null, true);
      }
      
      if (Array.isArray(CORS_ORIGIN)) {
        // Check if the origin is in the allowed list
        const originHost = origin.replace(/^https?:\/\//, '').split(':')[0];
        const allowedOrigins = CORS_ORIGIN.map(o => o.replace(/^https?:\/\//, '').split(':')[0]);
        
        if (allowedOrigins.includes(originHost) || CORS_ORIGIN.includes(origin)) {
          return callback(null, true);
        }
      } else if (origin === CORS_ORIGIN || 
                origin.replace(/^https?:\/\//, '').split(':')[0] === CORS_ORIGIN.replace(/^https?:\/\//, '').split(':')[0]) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  // Enable HTTP long-polling fallback
  transports: ['websocket', 'polling'],
  // Increase ping timeout for better WebSocket stability
  pingTimeout: 60000,
  pingInterval: 25000
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

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Socket.io connection handling
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      // Host creates game
      socket.on('host:createGame', async (payload, cb) => {
        try {
          console.log('Host creating new game...');
          const game = await gm.createGame(payload);
          
          if (!game || !game.code) {
            console.error('Failed to create game: No game returned or missing code');
            return cb?.({ ok: false, error: 'Failed to create game' });
          }
          
          console.log(`Game created: ${game.code}, joining room...`);
          socket.join(game.code);
          
          console.log('Attaching socket to game...');
          await gm.attachSocketToGame(socket, game.code, { isHost: true });
          
          console.log('Sending success response to client:', game);
          cb?.({ ok: true, game });
        } catch (e) {
          console.error('Error in host:createGame:', e);
          cb?.({ 
            ok: false, 
            error: e.message || 'Failed to create game',
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
          });
        }
      });

      // Host actions
      socket.on('host:startRound', async (payload, cb) => {
        try {
          const result = await gm.startRound(payload, socket.id);
          cb?.({ ok: true, ...result });
        } catch (e) {
          console.error('Error starting round:', e.message);
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
        console.log('Client disconnected:', socket.id);
        gm.handleDisconnect(socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
