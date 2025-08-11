import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';

import { connectDB } from './db.js';
import { createApp } from './app.js';
import { attachGameSocket } from './sockets/gameSocket.js';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: '*',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e8,
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
    serveClient: false,
    cookie: false,
    perMessageDeflate: false,
  });

  io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', err);
  });
  io.engine.on('upgrade_error', (err) => {
    console.error('Socket.IO upgrade error:', err);
  });

  attachGameSocket(io);

  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
