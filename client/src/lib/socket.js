import { io } from 'socket.io-client';

// Get server URL from environment or use default
const isDevelopment = import.meta.env.DEV;
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (isDevelopment ? 'http://localhost:4000' : 'https://your-server-url.com');

console.log(`Connecting to WebSocket server at: ${SERVER_URL}`);

// Configure socket connection with minimal settings
export const socket = io(SERVER_URL, {
  // Connection options
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 30000,
  
  // Transport settings - try WebSocket first, then fall back to polling
  transports: ['websocket', 'polling'],
  upgrade: true,
  forceNew: false,
  
  // WebSocket specific settings
  withCredentials: true,
  
  // Disable debug in production
  debug: import.meta.env.DEV,
  
  // Disable per-message deflate
  perMessageDeflate: false,
  
  // Don't close the connection when the page is hidden
  closeOnBeforeunload: false,
  
  // Timeout for the connection to be established
  connectTimeout: 30000,
  
  // Add a path if your server uses a specific path for Socket.IO
  path: '/socket.io/'
});

// Fallback to polling if WebSocket fails
socket.on('connect_error', (error) => {
  console.log('WebSocket connection failed, falling back to polling...', error);
  socket.io.opts.transports = ['polling', 'websocket'];
});

// Debug connection events
socket.on('connect', () => {
  console.log('✅ Connected to server with ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from server:', reason);
  if (reason === 'io server disconnect') {
    // The disconnection was initiated by the server, you need to reconnect manually
    console.log('Server initiated disconnection. Attempting to reconnect...');
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  console.error('🔴 Connection error:', error.message);
  // Attempt to reconnect after a delay
  setTimeout(() => {
    socket.connect();
  }, 1000);
});

socket.on('reconnect_attempt', (attempt) => {
  console.log(`🔄 Reconnection attempt ${attempt}`);});

socket.on('reconnect', (attempt) => {
  console.log(`✅ Successfully reconnected after ${attempt} attempts`);
});

socket.on('reconnect_error', (error) => {
  console.error('❌ Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('❌❌ Failed to reconnect to server');
});

// Handle any other errors
socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Export a function to manually connect if needed
export const connectSocket = () => {
  if (!socket.connected) {
    console.log('Manually connecting socket...');
    socket.connect();
  }
};

// Export a function to manually disconnect if needed
export const disconnectSocket = () => {
  if (socket.connected) {
    console.log('Manually disconnecting socket...');
    socket.disconnect();
  }
};
