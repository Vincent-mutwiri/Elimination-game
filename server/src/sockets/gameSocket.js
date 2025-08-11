import { nanoid } from 'nanoid';
import { Game } from '../models/Game.js';
import { toPublicGame, sanitizeQuestion, generateGameCode } from '../utils/game.js';

export function attachGameSocket(io) {
  function log(...args) {
    // Lightweight logger hook
    console.log('[socket]', ...args);
  }

  async function startRound({ code, question }, socketId) {
    const game = await Game.findOne({ code });
    if (!game) throw new Error('Game not found');

    if (game.hostSocketId !== socketId) {
      throw new Error('Only the host can start the game');
    }

    if (!question) {
      if (!game.questions || game.questions.length === 0) {
        throw new Error('No questions available for this game');
      }
      question = game.questions[(game.roundIndex + 1) % game.questions.length];
    }

    game.status = 'live';
    game.roundIndex += 1;
    const startedAt = Date.now();
    const timeMs = question.timeMs || 10000;
    const deadlineAt = startedAt + timeMs;

    game.currentRound = {
      index: game.roundIndex,
      question,
      startedAt,
      deadlineAt,
      answers: {},
    };

    await game.save();

    io.to(code).emit('round:start', {
      index: game.roundIndex,
      question: sanitizeQuestion(question),
      startedAt,
      deadlineAt,
    });

    setTimeout(() => resolveRound(code), timeMs + game.config.graceMs + 10);
    return { roundIndex: game.roundIndex, deadlineAt };
  }

  async function resolveRound(code) {
    const game = await Game.findOne({ code });
    if (!game || !game.currentRound) return;
    const round = game.currentRound;
    const question = round.question;

    const alivePlayers = game.players.filter((p) => p.isAlive);
    const answerMap = round.answers || {};
    const eliminated = [];
    const survivors = new Set();

    if (question.kind === 'estimate') {
      let closestPlayer = null;
      let minDiff = Infinity;

      for (const player of alivePlayers) {
        const answer = answerMap[player.id];
        if (answer && !answer.isLate && answer.value !== undefined) {
          const diff = Math.abs(answer.value - question.correctValue);
          if (diff < minDiff) {
            minDiff = diff;
            closestPlayer = player.id;
          }
        }
      }

      if (closestPlayer) {
        survivors.add(closestPlayer);
        const winner = game.players.find((p) => p.id === closestPlayer);
        if (winner) winner.score += 1000;
      }
    } else {
      for (const player of alivePlayers) {
        const a = answerMap[player.id];
        if (a && !a.isLate && a.isCorrect) {
          survivors.add(player.id);
          player.score += a.score;
        }
      }
    }

    game.players.forEach((p) => {
      if (p.isAlive && !survivors.has(p.id)) {
        p.isAlive = false;
        p.eliminatedAt = Date.now();
        eliminated.push({ id: p.id, name: p.name });
      }
    });

    game.pot += eliminated.length;

    const stillAlive = game.players.filter((p) => p.isAlive);
    const winner = stillAlive.length === 1 ? stillAlive[0] : null;

    if (winner) {
      game.status = 'ended';
      game.winner = { id: winner.id, name: winner.name };
    }

    game.currentRound = null;
    await game.save();

    const finalGameState = toPublicGame(game);

    io.to(code).emit('round:result', {
      index: round.index,
      eliminated,
      survivors: stillAlive.map((p) => ({ id: p.id, name: p.name, score: p.score })),
      winner: finalGameState.winner,
      pot: game.pot,
    });

    io.to(code).emit('game:state', finalGameState);
  }

  function register(io, socket) {
    log('client connected', socket.id);

    socket.on('host:createGame', async (payload, cb) => {
      try {
        const code = generateGameCode();
        const game = new Game({
          code,
          status: 'lobby',
          config: { cutMode: 'sudden', cutParam: 0.2, graceMs: 300 },
          questions: [],
          players: [],
          roundIndex: -1,
          pot: 0,
          hostPlayerId: payload?.hostPlayerId || nanoid(8),
          hostSocketId: socket.id,
        });

        const saved = await game.save();
        const state = toPublicGame(saved);

        socket.join(code);
        io.to(code).emit('game:state', state);
        cb?.({ ok: true, game: state });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('host:startRound', async (payload, cb) => {
      try {
        const result = await startRound(payload, socket.id);
        cb?.({ ok: true, ...result });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('host:nextRound', async (payload, cb) => {
      try {
        const result = await startRound({ code: payload.code, question: null }, socket.id);
        cb?.({ ok: true, ...result });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('host:endGame', async ({ code }, cb) => {
      try {
        const game = await Game.findOneAndUpdate(
          { code },
          { status: 'ended', currentRound: null },
          { new: true }
        );
        if (!game) throw new Error('Game not found');
        io.to(code).emit('game:state', toPublicGame(game));
        cb?.({ ok: true });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('player:join', async ({ code, name }, cb) => {
      try {
        const game = await Game.findOne({ code });
        if (!game) throw new Error('Game not found');
        if (game.status === 'ended') throw new Error('Game already ended');

        const existing = game.players.find((p) => p.socketId === socket.id);
        if (existing) {
          existing.socketId = socket.id;
          await game.save();
          return cb?.({ ok: true, player: { id: existing.id, name: existing.name, isAlive: existing.isAlive }, game: toPublicGame(game) });
        }

        const player = {
          id: nanoid(8),
          name,
          socketId: socket.id,
          isAlive: true,
          score: 0,
          powerUps: [
            { name: '50-50', used: false },
            { name: 'Skip', used: false },
          ],
          joinedAt: Date.now(),
          answers: {},
        };

        game.players.push(player);
        await game.save();

        io.to(code).emit('game:state', toPublicGame(game));

        cb?.({ ok: true, player: { id: player.id, name: player.name, isAlive: player.isAlive }, game: toPublicGame(game) });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('player:answer', async ({ code, roundIndex, payload }, cb) => {
      try {
        const game = await Game.findOne({ code });
        if (!game) throw new Error('Game not found');
        const round = game.currentRound;
        if (!round || round.index !== roundIndex) throw new Error('Round not active');

        const player = game.players.find((pl) => pl.socketId === socket.id);
        if (!player || !player.isAlive) throw new Error('Player not alive or not found');

        const receivedAt = Date.now();
        const isLate = receivedAt > round.deadlineAt + game.config.graceMs;

        let isCorrect = false;
        let score = 0;
        if (!isLate) {
          if (round.question.kind === 'mcq') {
            isCorrect = payload?.choiceIndex === round.question.correctIndex;
            if (isCorrect) {
              const timeTaken = receivedAt - round.startedAt;
              score = Math.max(0, round.question.timeMs - timeTaken);
            }
          }
        }

        if (!game.currentRound.answers) game.currentRound.answers = {};
        game.currentRound.answers[player.id] = {
          isCorrect,
          receivedAt,
          isLate,
          choiceIndex: payload?.choiceIndex,
          value: payload?.value,
          score,
        };

        await game.save();
        cb?.({ ok: true, accepted: true });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('player:usePowerUp', async ({ code, powerUpName }, cb) => {
      try {
        const game = await Game.findOne({ code });
        if (!game) throw new Error('Game not found');

        const player = game.players.find((pl) => pl.socketId === socket.id);
        if (!player || !player.isAlive) throw new Error('Player not alive or not found');

        const powerUp = player.powerUps.find((pu) => pu.name === powerUpName && !pu.used);
        if (!powerUp) throw new Error('Power-up not available');

        powerUp.used = true;
        await game.save();

        io.to(code).emit('game:powerUpUsed', {
          playerId: player.id,
          playerName: player.name,
          powerUpName,
        });

        cb?.({ ok: true, success: true });
      } catch (e) {
        cb?.({ ok: false, error: e.message });
      }
    });

    socket.on('player:sendEmote', ({ code, emote }) => {
      io.to(code).emit('game:emote', {
        playerId: socket.id,
        emote,
      });
    });

    socket.on('disconnect', () => {
      log('client disconnected', socket.id);
    });
  }

  io.on('connection', (socket) => register(io, socket));
}

export default attachGameSocket;
