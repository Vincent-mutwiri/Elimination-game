## 1. Adopt the "Squid Game" Theme
First, let's replace your current minimalist styles with the more thematic ones from the "Squid Game" project.

➡️ Action: In client/src/styles.css, replace the entire file content with the following:
client/src/styles.css
Aug 11, 7:39 PM

/* Squid Game Theme */
:root {
  --font-squid: 'Squada One', sans-serif;
  --bg-color: #121212;
  --card-color: #1E1E1E;
  --text-color: #E0E0E0;
  --pink: #FF007A;
  --teal: #00DDAA;
  --yellow: #FFD700;
  --border-color: #444;
  --danger-color: #D32F2F;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
}

.container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--pink);
  margin-bottom: 2rem;
}

header h1 {
  font-family: var(--font-squid);
  font-size: 2.5rem;
  color: var(--teal);
  letter-spacing: 2px;
}

nav {
  display: flex;
  gap: 1.5rem;
}

nav a {
  font-family: var(--font-squid);
  text-decoration: none;
  color: var(--text-color);
  font-size: 1.2rem;
  transition: color 0.3s ease;
}

nav a:hover {
  color: var(--pink);
}

.card {
  background-color: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.btn {
  font-family: var(--font-squid);
  font-size: 1.2rem;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: var(--pink);
  color: #fff;
  transition: background-color 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn:hover:not(:disabled) {
  background-color: #d40062;
}

.btn.secondary {
  background-color: var(--teal);
  color: var(--bg-color);
}

.btn.secondary:hover:not(:disabled) {
  background-color: #00b894;
}

.btn:disabled {
  background-color: #555;
  cursor: not-allowed;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form input, .form textarea, .form select {
  width: 100%;
  padding: 0.8rem;
  border-radius: 5px;
  border: 1px solid var(--border-color);
  background-color: #333;
  color: var(--text-color);
  font-size: 1rem;
}

.code {
  font-family: var(--font-squid);
  background-color: var(--bg-color);
  padding: 0.5rem 1rem;
  border: 1px solid var(--teal);
  border-radius: 5px;
  font-size: 2rem;
  color: var(--teal);
  letter-spacing: 4px;
  text-align: center;
}

.question {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--yellow);
}

.options {
  list-style: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.options label {
  display: block;
  padding: 1rem;
  background: #333;
  border: 2px solid var(--border-color);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.options input[type="radio"] {
  display: none;
}

.options input[type="radio"]:checked + span {
  color: var(--yellow);
}

.options label:hover {
  border-color: var(--pink);
}

.list {
    list-style: none;
    padding: 0;
}
.list li {
    background: #2a2a2a;
    padding: 1rem;
    margin-bottom: 0.5rem;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pill {
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
}
.pill.alive {
    background-color: var(--teal);
    color: var(--bg-color);
}
.pill.dead {
    background-color: var(--danger-color);
    color: #fff;
}


➡️ Action: In client/index.html, add the "Squada One" font from Google Fonts. Replace the file content with this:
client/index.html
Aug 11, 7:39 PM

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Last Player Standing</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Squada+One&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>


## 2. Implement an Interactive Player Page
This new Player page will feature a more engaging UI with a dedicated question card and a round timer.

➡️ Action: In client/src/pages/Player.jsx, replace the entire file content with this:
client/src/pages/Player.jsx
Aug 11, 7:39 PM

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


With these changes, your game will have a much more polished and engaging UI, closely resembling the "Squid Game" project you provided.