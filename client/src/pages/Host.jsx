import React, { useEffect, useState } from 'react';
import { socket } from '../lib/socket.js';
import Lobby from '../components/Lobby.jsx';
import QuestionForm from '../components/QuestionForm.jsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function Host() {
  const [game, setGame] = useState(null);
  const [creating, setCreating] = useState(false);
  const [roundBusy, setRoundBusy] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    // Fetch questions from database
    fetch(`${SERVER_URL}/api/questions`)
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error('Failed to fetch questions', err));

    // Handle game state updates
    const handleGameState = (payload) => {
      console.log('Received game state:', payload);
      setGame(payload);
    };

    // Handle errors from the server
    const handleError = (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'An error occurred');
    };

    socket.on('game:state', handleGameState);
    socket.on('error', handleError);

    socket.on('round:start', (payload) => {
      console.log('Round started:', payload);
      setGame(g => ({ ...g, currentRound: payload }));
    });

    socket.on('round:result', (payload) => {
      console.log('Round result:', payload);
      // merge into game state; server will also send game:state
    });

    // Clean up event listeners
    return () => {
      socket.off('game:state', handleGameState);
      socket.off('error', handleError);
      socket.off('round:start');
      socket.off('round:result');
    };
  }, []);

  const createGame = () => {
    setCreating(true);
    console.log('Creating new game...');

    socket.emit('host:createGame', {}, (res) => {
      setCreating(false);

      if (!res?.ok) {
        const errorMessage = res?.error || 'Failed to create game';
        console.error('Error creating game:', errorMessage);
        toast.error(errorMessage);
        return;
      }

      console.log('Game created successfully:', res.game);
      toast.success(`Game created with code: ${res.game.code}`);
      setGame(res.game);
    });
  }

  const startRound = (question) => {
    if (!game) {
      toast.error('No active game found');
      return;
    }

    setRoundBusy(true);
    console.log('Starting round with question:', question);

    socket.emit('host:startRound', { code: game.code, question }, (res) => {
      setRoundBusy(false);

      if (!res?.ok) {
        const errorMessage = res?.error || 'Failed to start round';
        console.error('Error starting round:', errorMessage);
        toast.error(errorMessage);
        return;
      }

      console.log('Round started successfully');
      toast.success('Round started!');
    });
  }

  const startWithSelectedQuestion = () => {
    if (selectedQuestion) {
      startRound(selectedQuestion);
    }
  }

  const nextRound = () => {
    if (!game) {
      toast.error('No active game found');
      return;
    }

    setRoundBusy(true);
    console.log('Starting next round...');

    socket.emit('host:nextRound', { code: game.code }, (res) => {
      setRoundBusy(false);

      if (!res?.ok) {
        const errorMessage = res?.error || 'Failed to start next round';
        console.error('Error starting next round:', errorMessage);
        toast.error(errorMessage);
        return;
      }

      console.log('Next round started successfully');
      toast.success('Next round started!');
    });
  }

  return (
    <section className="card">
      <h2>Host</h2>
      {!game ? (
        <button className="btn" onClick={createGame} disabled={creating}>
          {creating ? 'Creating…' : 'Create Game'}
        </button>
      ) : (
        <>
          <div className="grid">
            <div>
              <p><strong>Code:</strong> <span className="code">{game.code}</span></p>
              <p><strong>Status:</strong> {game.status}</p>
              <p><strong>Players alive:</strong> {game.players?.filter(p => p.isAlive).length || 0}</p>
              <p><strong>Pot:</strong> {game.pot || 0}</p>
            </div>
            <Lobby players={game.players || []} />
          </div>

          <hr />

          <h3>Round Controls</h3>
          {game.currentRound ? (
            <div className="muted">Round in progress… wait for results.</div>
          ) : (
            <>
              <div className="question-selector">
                <h4>Select Question from Database</h4>
                <select 
                  value={selectedQuestion?._id || ''} 
                  onChange={(e) => {
                    const q = questions.find(q => q._id === e.target.value);
                    setSelectedQuestion(q);
                  }}
                >
                  <option value="">Choose a question...</option>
                  {questions.map(q => (
                    <option key={q._id} value={q._id}>
                      {q.body.substring(0, 50)}... ({q.kind})
                    </option>
                  ))}
                </select>
                {selectedQuestion && (
                  <div className="selected-question">
                    <p><strong>{selectedQuestion.body}</strong></p>
                    <p>Type: {selectedQuestion.kind} | Time: {selectedQuestion.timeMs}ms</p>
                    <button className="btn" onClick={startWithSelectedQuestion} disabled={roundBusy}>
                      Start Selected Question
                    </button>
                  </div>
                )}
              </div>
              <hr />
              <h4>Or Create Custom Question</h4>
              <QuestionForm busy={roundBusy} onStart={startRound} onNext={nextRound} />
            </>
          )}
        </>
      )}
    </section>
  )
}