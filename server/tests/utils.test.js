import { describe, it, expect } from 'vitest';
import { generateGameCode, sanitizeQuestion, toPublicGame } from '../src/utils/game.js';

describe('utils/game', () => {
  it('generateGameCode returns 6-digit numeric string', () => {
    const code = generateGameCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('sanitizeQuestion strips sensitive fields', () => {
    const q = { id: 'q1', body: 'b', options: ['a'], kind: 'mcq', timeMs: 1000, correctValue: 1, correctIndex: 0 };
    const s = sanitizeQuestion(q);
    expect(s).toEqual({ id: 'q1', body: 'b', options: ['a'], kind: 'mcq', timeMs: 1000, correctValue: 1 });
  });

  it('toPublicGame maps fields with defaults', () => {
    const g = { code: '123456', players: [{ id: 'p1', name: 'A', isAlive: true, score: 0, powerUps: [] }], pot: 0 };
    const pub = toPublicGame(g);
    expect(pub.code).toBe('123456');
    expect(pub.players[0].name).toBe('A');
  });
});
