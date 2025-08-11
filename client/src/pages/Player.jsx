import React, { useEffect, useState, useRef } from 'react';
import { socket } from '../lib/socket.js';
import { useSounds } from '../hooks/useSounds.js';

// A custom hook for the round timer
function useRoundTimer(deadline) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!deadline) {
      setTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((new Date(deadline) - Date.now()) / 1000));
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return timeRemaining;
}


// The Question Card Component
function QuestionCard({ round, onAnswer, locked, eliminated }) {
  const [choice, setChoice] = useState(null);
  const timeRemaining = useRoundTimer(round.deadlineAt);

  const submit = () => {
    if (choice !== null) {
      onAnswer(choice);
    }
  };

  return (
    <div className="bg-gray-900 border-2 border-pink-500 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">🧠 Trivia Challenge</h3>
        <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${
          timeRemaining > 10 ? 'bg-green-500' : 
          timeRemaining > 5 ? 'bg-yellow-500' : 'bg-red-500'
        } text-white`}>
          {timeRemaining > 0 ? `${timeRemaining}s` : 'Time Up!'}
        </div>
      </div>
      <p className="question">{round.question.body}</p>
      <ul className="options">
        {round.question.options.map((opt, i) => (
          <li key={i}>
            <label>
              <input type="radio" name="answer" disabled={locked || eliminated} checked={choice === i} onChange={() => setChoice(i)} />
              <span>{opt}</span>
            </label>
          </li>
        ))}
      </ul>
      <button className="btn" disabled={choice === null || locked || eliminated} onClick={submit}>
        {locked ? 'Answer Locked' : 'Lock In'}
      </button>
    </div>
  );
}


export default function Player() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [game, setGame] = useState(null);
  const [round, setRound] = useState(null);
  const [locked, setLocked] = useState(false);
  const [eliminated, setEliminated] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const playSound = useSounds();

  useEffect(() => {
    const onGameState = (payload) => setGame(payload);
    const onRoundStart = (payload) => {
      setRound(payload);
      setLocked(false);
      playSound('countdown');
    };
    const onRoundResult = (payload) => {
        const amIalive = payload.survivors.some(p => p.id === playerId);
        if (!amIalive) setEliminated(true);
    };

    socket.on('game:state', onGameState);
    socket.on('round:start', onRoundStart);
    socket.on('round:result', onRoundResult);

    return () => {
      socket.off('game:state', onGameState);
      socket.off('round:start', onRoundStart);
      socket.off('round:result', onRoundResult);
    };
  }, [playerId, playSound]);

  const joinGame = (e) => {
    e.preventDefault();
    socket.emit('player:join', { code: code.trim().toUpperCase(), name: name.trim() }, (res) => {
      if (res.ok) {
        setJoined(true);
        setPlayerId(res.player.id);
        setGame(res.game);
      } else {
        alert(res.error || 'Failed to join');
      }
    });
  };

  const submitAnswer = (choiceIndex) => {
    if (locked) return;
    setLocked(true);
    const payload = { choiceIndex };
    socket.emit('player:answer', { code, roundIndex: round.index, payload });
  };
  
  if (!joined) {
    return (
      <section className="card">
        <h2>Join Game</h2>
        <form onSubmit={joinGame} className="form">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="GAME CODE" required />
          <input value={name} onChange={e => setName(e.target.value)} placeholder="YOUR NAME" required />
          <button className="btn" type="submit">Join</button>
        </form>
      </section>
    );
  }

  const amIalive = game?.players.find(p => p.id === playerId)?.isAlive;

  return (
    <section className="card">
       <h2>{name}</h2>
      <p>Status: <span className={amIalive ? 'pill alive' : 'pill dead'}>{amIalive ? 'Alive' : 'Eliminated'}</span></p>
      
      <hr />
      
      {round && amIalive && (
        <QuestionCard round={round} onAnswer={submitAnswer} locked={locked} eliminated={!amIalive} />
      )}
      
      {!round && <h2>Waiting for the next round...</h2>}
       {game?.winner && <div className="muted">{`Game Over! Winner: ${game.winner.name}`}</div>}
    </section>
  );
}
