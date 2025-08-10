import React, { useState } from 'react';

export default function QuestionEditor({ question: initialQuestion, onSave, onCancel }) {
  const [question, setQuestion] = useState(initialQuestion || { 
    kind: 'mcq', 
    body: '', 
    options: ['', ''], 
    correctIndex: 0, 
    correctValue: '', 
    timeMs: 10000 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuestion(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...question.options];
    newOptions[index] = value;
    setQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setQuestion(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(question);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h3>{question._id ? 'Edit' : 'Add'} Question</h3>
      <label>Kind</label>
      <select name="kind" value={question.kind} onChange={handleChange}>
        <option value="mcq">Multiple Choice</option>
        <option value="estimate">Estimate</option>
      </select>

      <label>Body</label>
      <textarea name="body" value={question.body} onChange={handleChange} rows={3} required />

      {question.kind === 'mcq' && (
        <>
          <label>Options</label>
          {(question.options || []).map((opt, i) => (
            <div key={i} className="row">
              <input value={opt} onChange={e => handleOptionChange(i, e.target.value)} required />
              <label className="inline">
                <input type="radio" name="correctIndex" checked={i === question.correctIndex} onChange={() => setQuestion(prev => ({ ...prev, correctIndex: i }))} />
                Correct
              </label>
            </div>
          ))}
          <button type="button" className="btn small" onClick={addOption}>+ Option</button>
        </>
      )}

      {question.kind === 'estimate' && (
        <>
          <label>Correct Value</label>
          <input 
            type="number" 
            name="correctValue" 
            value={question.correctValue || ''} 
            onChange={handleChange} 
            placeholder="Enter the correct numerical answer"
            required 
          />
        </>
      )}


      <label>Time (ms)</label>
      <input type="number" name="timeMs" value={question.timeMs} onChange={handleChange} required />

      <div className="actions">
        <button className="btn" type="submit">Save</button>
        <button className="btn secondary" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
