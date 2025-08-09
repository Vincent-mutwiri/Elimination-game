import React, { useEffect, useState } from 'react'
import { socket } from '../lib/socket.js'
import Lobby from '../components/Lobby.jsx'
import QuestionForm from '../components/QuestionForm.jsx'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Host() {
  const [game, setGame] = useState(null)
  const [creating, setCreating] = useState(false)
  const [roundBusy, setRoundBusy] = useState(false)

  useEffect(() => {
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
  }, [])

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
            <QuestionForm busy={roundBusy} onStart={startRound} onNext={nextRound} />
          )}
        </>
      )}
    </section>
  )
}
