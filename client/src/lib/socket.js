import { io } from 'socket.io-client';

// Get server URL from environment or use default
const isDevelopment = import.meta.env.DEV;
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (isDevelopment ? 'http://localhost:4000' : 'https://your-server-url.com');

console.log(`Connecting to WebSocket server at: ${SERVER_URL}`);

// Configure socket connection
export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling']
});

// Debug connection events
socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
