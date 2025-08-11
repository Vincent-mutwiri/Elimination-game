import React, { useState } from 'react';
import { buildQuestionPayload, validateQuestionPayload } from '../utils/question.js';

export default function QuestionForm({ busy, onStart, onNext }) {
  const [kind, setKind] = useState('mcq');
  const [body, setBody] = useState('What color was the first traffic light?');
  const [options, setOptions] = useState(['Red/Green', 'Red/Yellow', 'Green/Yellow', 'Blue/Red']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [correctValue, setCorrectValue] = useState('');
  const [timeMs, setTimeMs] = useState(12000);
  const [error, setError] = useState('');

  const start = (e) => {
    e.preventDefault();
    const payload = buildQuestionPayload({ kind, body, options, correctIndex, correctValue, timeMs });
    const err = validateQuestionPayload(payload);
    if (err) {
      setError(err);
      return;
    }
    onStart?.({ id: 'custom-' + Date.now(), ...payload });
  };

  return (
    <form onSubmit={start} className="form">
      <label>Kind</label>
      <select value={kind} onChange={(e) => setKind(e.target.value)}>
        <option value="mcq">Multiple Choice</option>
        <option value="estimate">Estimate</option>
      </select>

      <label>Question</label>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} />

      {kind === 'mcq' && (
        <>
          <label>Options</label>
          {options.map((o, i) => (
            <div key={i} className="row">
              <input
                value={o}
                onChange={(e) => {
                  const next = options.slice();
                  next[i] = e.target.value;
                  setOptions(next);
                }}
              />
              <label className="inline">
                <input type="radio" checked={i === correctIndex} onChange={() => setCorrectIndex(i)} />
                Correct
              </label>
            </div>
          ))}
          <button type="button" className="btn small" onClick={() => setOptions([...options, 'New option'])}>
            + Option
          </button>
        </>
      )}

      {kind === 'estimate' && (
        <>
          <label>Correct value</label>
          <input type="number" value={correctValue} onChange={(e) => setCorrectValue(e.target.value)} />
        </>
      )}

      <label>Timer (ms)</label>
      <input type="number" value={timeMs} onChange={(e) => setTimeMs(Number(e.target.value))} />

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button className="btn" type="submit" disabled={busy}>
          Start Round
        </button>
        <button className="btn secondary" type="button" disabled={busy} onClick={onNext}>
          Next (auto pick)
        </button>
      </div>
    </form>
  );
}
