import { nanoid } from 'nanoid';

export function generateGameCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function sanitizeQuestion(question) {
  if (!question) return null;
  return {
    id: question.id,
    body: question.body,
    options: question.options,
    kind: question.kind,
    timeMs: question.timeMs,
    correctValue: question.correctValue,
  };
}

export function toPublicGame(gameDocument) {
  if (!gameDocument) return null;
  const game = gameDocument.toObject ? gameDocument.toObject() : gameDocument;

  return {
    code: game.code || '',
    status: game.status || 'lobby',
    roundIndex: game.roundIndex ?? -1,
    config: game.config || { cutMode: 'sudden', cutParam: 0.2, graceMs: 300 },
    players: (game.players || []).map((player) => ({
      id: player.id || nanoid(8),
      name: player.name || 'Player',
      isAlive: player.isAlive !== false,
      score: player.score || 0,
      powerUps: player.powerUps || [],
      joinedAt: player.joinedAt || Date.now(),
    })),
    pot: game.pot || 0,
    currentRound: game.currentRound
      ? {
          index: game.currentRound.index ?? 0,
          question: sanitizeQuestion(game.currentRound.question),
          deadlineAt: game.currentRound.deadlineAt,
          startedAt: game.currentRound.startedAt,
        }
      : null,
    winner: game.winner || null,
  };
}
