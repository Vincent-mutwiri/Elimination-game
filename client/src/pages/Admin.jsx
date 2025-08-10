import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QuestionEditor from '../components/QuestionEditor.jsx';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function Admin() {
  const [games, setGames] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [activeTab, setActiveTab] = useState('games');

  useEffect(() => {
    Promise.all([
      fetch(`${SERVER_URL}/api/games`).then(res => res.json()),
      fetch(`${SERVER_URL}/api/questions`).then(res => res.json())
    ]).then(([gamesData, questionsData]) => {
      setGames(gamesData);
      setQuestions(questionsData);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch data', err);
      setLoading(false);
    });
  }, []);

  const handleSaveQuestion = async (question) => {
    try {
      const url = question._id 
        ? `${SERVER_URL}/api/questions/${question._id}`
        : `${SERVER_URL}/api/questions`;
      const method = question._id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question)
      });
      
      if (res.ok) {
        const savedQuestion = method === 'POST' ? await res.json() : question;
        setQuestions(prev => {
          if (question._id) {
            return prev.map(q => q._id === question._id ? savedQuestion : q);
          }
          return [savedQuestion, ...prev];
        });
        setEditingQuestion(null);
      }
    } catch (err) {
      console.error('Failed to save question', err);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm('Delete this question?')) {
      try {
        const res = await fetch(`${SERVER_URL}/api/questions/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setQuestions(prev => prev.filter(q => q._id !== id));
        }
      } catch (err) {
        console.error('Failed to delete question', err);
      }
    }
  };

  if (loading) return <div className="muted">Loading...</div>;

  return (
    <section className="card">
      <h2>Admin Dashboard</h2>
      
      <div className="tabs">
        <button 
          className={activeTab === 'games' ? 'btn active' : 'btn secondary'} 
          onClick={() => setActiveTab('games')}
        >
          Games
        </button>
        <button 
          className={activeTab === 'questions' ? 'btn active' : 'btn secondary'} 
          onClick={() => setActiveTab('questions')}
        >
          Questions
        </button>
      </div>

      {activeTab === 'games' && (
        <>
          <h3>Recent Games</h3>
          <p>Showing the last 50 games created.</p>
          <div className="list">
            {games.length > 0 ? games.map(game => (
              <Link to={`/admin/${game.code}`} key={game.code} className="list-item">
                <div>
                  <strong>Code: {game.code}</strong>
                  <small className="muted"> ({game.status})</small>
                </div>
                <small className="muted">
                  {game.players?.length || 0} players, created at {new Date(game.createdAt).toLocaleString()}
                </small>
              </Link>
            )) : <p className="muted">No games found.</p>}
          </div>
        </>
      )}

      {activeTab === 'questions' && (
        <>
          {editingQuestion ? (
            <QuestionEditor
              question={editingQuestion}
              onSave={handleSaveQuestion}
              onCancel={() => setEditingQuestion(null)}
            />
          ) : (
            <>
              <div className="actions">
                <button className="btn" onClick={() => setEditingQuestion({})}>
                  + Add Question
                </button>
              </div>
              <h3>Questions ({questions.length})</h3>
              <div className="list">
                {questions.map(q => (
                  <div key={q._id} className="list-item">
                    <div>
                      <strong>{q.body}</strong>
                      <small className="muted"> ({q.kind})</small>
                    </div>
                    <div className="actions">
                      <button className="btn small" onClick={() => setEditingQuestion(q)}>Edit</button>
                      <button className="btn small danger" onClick={() => handleDeleteQuestion(q._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}