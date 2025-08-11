// Deprecated: server-side game manager has been moved to socket handlers
// Kept for backward-compatibility if imported elsewhere
export function createGameManager() {
  throw new Error('createGameManager has moved to sockets. Use attachGameSocket(io) instead.');
}