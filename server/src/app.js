import express from 'express';
import cors from 'cors';

import gamesRouter from './routes/games.js';
import questionsRouter from './routes/questions.js';

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
  credentials: true,
  optionsSuccessStatus: 204,
};

export function createApp() {
  const app = express();
  app.use(cors(corsOptions));
  app.use(express.json());

  app.get('/health', (_, res) => res.json({ ok: true }));

  app.use('/api', gamesRouter);
  app.use('/api', questionsRouter);

  return app;
}

export default createApp;
