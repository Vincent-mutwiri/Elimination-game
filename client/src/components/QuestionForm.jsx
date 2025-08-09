import React, { useState } from 'react'

export default function QuestionForm({ busy, onStart, onNext }) {
  const [body, setBody] = useState('What color was the first traffic light?')
  const [options, setOptions] = useState(['Red/Green','Red/Yellow','Green/Yellow','Blue/Red'])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [timeMs, setTimeMs] = useState(12000)

  const start = (e) => {
    e.preventDefault()
    onStart?.({ id: 'custom-'+Date.now(), kind: 'mcq', body, options, correctIndex, timeMs })
  }

  return (
    <form onSubmit={start} className="form">
      <label>Question</label>
      <textarea value={body} onChange={e => setBody(e.target.value)} rows={2} />
      <label>Options</label>
      {options.map((o, i) => (
        <div key={i} className="row">
          <input value={o} onChange={e => {
            const next = options.slice(); next[i] = e.target.value; setOptions(next)
          }} />
          <label className="inline">
            <input type="radio" checked={i===correctIndex} onChange={() => setCorrectIndex(i)} />
            Correct
          </label>
        </div>
      ))}
      <button type="button" className="btn small" onClick={() => setOptions([...options, 'New option'])}>+ Option</button>
      <label>Timer (ms)</label>
      <input type="number" value={timeMs} onChange={e => setTimeMs(Number(e.target.value))} />
      <div className="actions">
        <button className="btn" type="submit" disabled={busy}>Start Round</button>
        <button className="btn secondary" type="button" disabled={busy} onClick={onNext}>Next (auto pick)</button>
      </div>
    </form>
  )
}
