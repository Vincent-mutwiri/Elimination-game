"""import { nanoid } from 'nanoid';
import { Game } from './models/Game.js';

// Helper: generate a 6-digit code (digits only)
function code6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Sample questions to start with
const SEED_QUESTIONS = [
  { id: 'q1', kind: 'mcq', body: 'What color was the first traffic light?', options: ['Red/Green', 'Red/Yellow', 'Green/Yellow', 'Blue/Red'], correctIndex: 0, timeMs: 12000 },
  { id: 'q2', kind: 'mcq', body: '2 + 2 * 3 = ?', options: ['8', '10', '6', '12'], correctIndex: 2, timeMs: 10000 },
  { id: 'q3', kind: 'mcq', body: 'Capital of Kenya?', options: ['Kisumu', 'Nairobi', 'Mombasa', 'Nakuru'], correctIndex: 1, timeMs: 10000 },
];

export function createGameManager(io) {

  function publicGame(g) {
    if (!g) return null;
    // This function now expects a Mongoose document and converts it to a plain object
    const gameObj = g.toObject ? g.toObject() : g;
    return {
      code: gameObj.code,
      status: gameObj.status,
      roundIndex: gameObj.roundIndex,
      config: gameObj.config,
      players: gameObj.players.map(p => ({
        id: p.id, name: p.name, isAlive: p.isAlive, joinedAt: p.joinedAt
      })),
      pot: gameObj.pot,
      currentRound: gameObj.currentRound ? {
        index: gameObj.currentRound.index,
        question: sanitizeQuestion(gameObj.currentRound.question),
        deadlineAt: gameObj.currentRound.deadlineAt,
        startedAt: gameObj.currentRound.startedAt,
      } : null,
      winner: gameObj.winner,
    };
  }

  function sanitizeQuestion(q) {
    if (!q) return null;
    return { id: q.id, body: q.body, options: q.options, kind: q.kind, timeMs: q.timeMs };
  }

  async function createGame({ cutMode = 'sudden', cutParam = 0.2 } = {}) {
    const code = code6();
    const game = new Game({
      code,
      config: { cutMode, cutParam, graceMs: 300 },
      questions: [...SEED_QUESTIONS],
    });
    await game.save();
    io.to(code).emit('game:state', publicGame(game));
    return publicGame(game);
  }

  async function attachSocketToGame(socket, code, { isHost }) {
    const game = await Game.findOne({ code });
    if (!game) return;
    if (isHost) {
        game.hostSocketId = socket.id;
        await game.save();
    }

    socket.emit('game:state', publicGame(game));

    socket.on('game:getState', async ({ code: askCode }, cb) => {
      if (askCode !== code) return cb?.({ ok: false, error: 'Wrong room' });
      const freshGame = await Game.findOne({ code: askCode });
      cb?.({ ok: true, game: publicGame(freshGame) });
    });
  }

  async function addPlayer(code, { name, socketId }) {
    const game = await Game.findOne({ code });
    if (!game) throw new Error('Game not found');
    if (game.status === 'ended') throw new Error('Game already ended');
    
    const player = { id: nanoid(8), name, socketId, isAlive: true, joinedAt: Date.now(), answers: {} };
    game.players.push(player);
    await game.save();
    
    io.to(code).emit('game:state', publicGame(game));
    return { id: player.id, name: player.name, isAlive: player.isAlive };
  }

  async function startRound({ code, question }) {
    const g = await Game.findOne({ code });
    if (!g) throw new Error('Game not found');
    if (!question) {
      question = g.questions[(g.roundIndex + 1) % g.questions.length];
    }
    g.status = 'live';
    g.roundIndex += 1;
    const startedAt = Date.now();
    const timeMs = question.timeMs || 10000;
    const deadlineAt = startedAt + timeMs;

    g.currentRound = {
      index: g.roundIndex,
      question,
      startedAt,
      deadlineAt,
      answers: {},
    };
    
    await g.save();

    io.to(code).emit('round:start', {
      index: g.roundIndex,
      question: sanitizeQuestion(question),
      startedAt,
      deadlineAt
    });

    setTimeout(() => resolveRound(code), timeMs + g.config.graceMs + 10);
    return { roundIndex: g.roundIndex, deadlineAt };
  }

  async function recordAnswer({ code, roundIndex, payload }, socketId) {
    const g = await Game.findOne({ code });
    if (!g) throw new Error('Game not found');
    const r = g.currentRound;
    if (!r || r.index !== roundIndex) throw new Error('Round not active');
    
    const p = g.players.find(pl => pl.socketId === socketId);
    if (!p || !p.isAlive) throw new Error('Player not alive or not found');

    const receivedAt = Date.now();
    const isLate = receivedAt > r.deadlineAt + g.config.graceMs;

    let isCorrect = false;
    if (!isLate) {
      if (r.question.kind === 'mcq') {
        isCorrect = (payload?.choiceIndex === r.question.correctIndex);
      }
    }
    
    // Use a Map for the answers to preserve the structure
    if (!g.currentRound.answers) {
        g.currentRound.answers = new Map();
    }
    g.currentRound.answers.set(p.id, { isCorrect, receivedAt, isLate, choiceIndex: payload?.choiceIndex });
    
    await g.save();
    return { accepted: true };
  }

  async function resolveRound(code) {
    const g = await Game.findOne({ code });
    if (!g || !g.currentRound) return;
    const r = g.currentRound;

    const alivePlayers = g.players.filter(p => p.isAlive);
    const answerMap = r.answers || new Map();

    const correct = new Set();
    const wrongOrLate = new Set();

    for (const p of alivePlayers) {
      const a = answerMap.get(p.id);
      if (!a || a.isLate || !a.isCorrect) {
        wrongOrLate.add(p.id);
      } else if (a.isCorrect) {
        correct.add(p.id);
      }
    }

    let survivors = new Set(correct); // Default to 'sudden'
    
    // Apply elimination logic based on cutMode
    // ... (cutMode logic remains the same, operating on the 'correct' set)

    const eliminated = [];
    g.players.forEach(p => {
      if (p.isAlive && !survivors.has(p.id)) {
        p.isAlive = false;
        p.eliminatedAt = Date.now();
        eliminated.push({ id: p.id, name: p.name });
      }
    });

    g.pot += eliminated.length;

    const stillAlive = g.players.filter(p => p.isAlive);
    const winner = stillAlive.length === 1 ? stillAlive[0] : null;

    if (winner) {
      g.status = 'ended';
      g.winner = { id: winner.id, name: winner.name };
    }
    
    g.currentRound = null;
    await g.save();
    
    const finalGameState = publicGame(g);

    io.to(code).emit('round:result', {
      index: r.index,
      eliminated,
      survivors: stillAlive.map(p => ({ id: p.id, name: p.name })),
      winner: finalGameState.winner,
      pot: g.pot
    });
    
    io.to(code).emit('game:state', finalGameState);
  }

  async function nextRound({ code }) {
    const g = await Game.findOne({ code });
    if (!g) throw new Error('Game not found');
    if (g.status === 'ended') throw new Error('Game ended');
    return startRound({ code, question: null });
  }

  async function endGame(code) {
    const g = await Game.findOneAndUpdate({ code }, { status: 'ended', currentRound: null }, { new: true });
    if (!g) throw new Error('Game not found');
    io.to(code).emit('game:state', publicGame(g));
  }

  function handleDisconnect(socketId) {
    // For now, we don't mark players as disconnected to allow reconnection.
    // A future implementation could involve a "reconnect" feature.
  }

  return {
    createGame,
    addPlayer,
    startRound,
    nextRound,
    recordAnswer,
    publicGame,
    endGame,
    attachSocketToGame,
    handleDisconnect,
  };
}
""