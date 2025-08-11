import React, { useState } from 'react';

export default function QuestionEditor({ question: initialQuestion, onSave, onCancel }) {
  const [question, setQuestion] = useState(initialQuestion || {
    kind: 'mcq',
    body: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    timeMs: 15000
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuestion(prev => ({ ...prev, [name]: name === 'timeMs' ? Number(value) : value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...question.options];
    newOptions[index] = value;
    setQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setQuestion(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (index) => {
    if (question.options.length <= 2) return;
    setQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
      correctIndex: prev.correctIndex === index ? 0 : prev.correctIndex
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(question);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h3>{question._id ? 'Edit' : 'Add'} Question</h3>

      <label>Question Text</label>
      <textarea name="body" value={question.body} onChange={handleChange} rows={3} required />

      <label>Options</label>
      {question.options.map((opt, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input value={opt} onChange={e => handleOptionChange(i, e.target.value)} required />
          <label>
            <input type="radio" name="correctIndex" checked={i === Number(question.correctIndex)} onChange={() => setQuestion(prev => ({ ...prev, correctIndex: i }))} />
            Correct
          </label>
          <button type="button" onClick={() => removeOption(i)} disabled={question.options.length <= 2}>X</button>
        </div>
      ))}
      <button type="button" className="btn secondary" onClick={addOption}>+ Add Option</button>

      <label>Time (ms)</label>
      <input type="number" name="timeMs" value={question.timeMs} onChange={handleChange} required />

      <div className="actions">
        <button className="btn" type="submit">Save Question</button>
        {onCancel && <button className="btn secondary" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
