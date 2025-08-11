import { describe, it, expect } from 'vitest';
import { buildQuestionPayload, validateQuestionPayload } from '../src/utils/question.js';

describe('client utils/question', () => {
  it('builds mcq payload', () => {
    const payload = buildQuestionPayload({ kind: 'mcq', body: 'b', options: ['a','b'], correctIndex: 1, timeMs: 5000 });
    expect(payload).toMatchObject({ kind: 'mcq', body: 'b', options: ['a', 'b'], correctIndex: 1, timeMs: 5000 });
  });

  it('validates mcq payload', () => {
    const err = validateQuestionPayload({ kind: 'mcq', body: 'x', options: ['a', 'b'], correctIndex: 1, timeMs: 1000 });
    expect(err).toBeNull();
  });

  it('rejects invalid estimate payload', () => {
    const err = validateQuestionPayload({ kind: 'estimate', body: 'x', correctValue: NaN, timeMs: 1000 });
    expect(err).toBeTypeOf('string');
  });
});
