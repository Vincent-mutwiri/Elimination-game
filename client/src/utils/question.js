export function buildQuestionPayload(input) {
  const base = {
    kind: input.kind,
    body: String(input.body || '').trim(),
    timeMs: Number(input.timeMs || 10000),
  };

  if (base.kind === 'mcq') {
    const options = (input.options || []).map((o) => String(o || '').trim()).filter(Boolean);
    const correctIndex = Number(input.correctIndex ?? -1);
    return { ...base, options, correctIndex };
  }
  if (base.kind === 'estimate') {
    const correctValue = Number(input.correctValue);
    return { ...base, correctValue };
  }
  return base;
}

export function validateQuestionPayload(q) {
  if (!q.body) return 'Body is required';
  if (!['mcq', 'estimate'].includes(q.kind)) return 'Invalid kind';
  if (q.kind === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) return 'At least two options required';
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) return 'Correct option out of range';
  }
  if (q.kind === 'estimate') {
    if (!Number.isFinite(q.correctValue)) return 'Correct value must be a number';
  }
  if (!Number.isFinite(q.timeMs) || q.timeMs <= 0) return 'Time must be positive';
  return null;
}
