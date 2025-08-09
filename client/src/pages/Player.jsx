import React, { useEffect, useState } from 'react'
import { socket } from '../lib/socket.js'

export default function Player() {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [joined, setJoined] = useState(false)
  const [game, setGame] = useState(null)
  const [round, setRound] = useState(null)
  const [choice, setChoice] = useState(null)
  const [locked, setLocked] = useState(false)
  const [eliminated, setEliminated] = useState(false)
  const [playerId, setPlayerId] = useState(null)

  useEffect(() => {
    socket.on('game:state', payload => {
      setGame(payload)
      if (!payload?.currentRound) {
        setRound(null)
        setLocked(false)
        setChoice(null)
      }
    })
    socket.on('round:start', payload => {
      setRound(payload)
      setLocked(false)
      setChoice(null)
    })
    socket.on('round:result', payload => {
      if (payload.winner) {
        // If this player is the winner, congrats; otherwise spectator screen.
        const alive = payload.survivors.map(s => s.id)
        if (!alive.includes(playerId)) setEliminated(true)
      } else {
        // Check if eliminated
        const alive = payload.survivors.map(s => s.id)
        if (!alive.includes(playerId)) setEliminated(true)
      }
    })
    return () => {
      socket.off('game:state')
      socket.off('round:start')
      socket.off('round:result')
    }
  }, [playerId])

  const join = (e) => {
    e.preventDefault()
    socket.emit('player:join', { code, name }, (res) => {
      if (!res?.ok) return alert(res.error || 'Join failed')
      setJoined(true)
      setPlayerId(res.player.id)
      setGame(res.game)
    })
  }

  const submitAnswer = () => {
    if (!round || choice == null || locked) return
    setLocked(true)
    socket.emit('player:answer', {
      code,
      roundIndex: round.index,
      payload: { choiceIndex: choice }
    }, (res) => {
      // lock regardless; server decides correctness
    })
  }

  if (!joined) {
    return (
      <section className="card">
        <h2>Join Game</h2>
        <form onSubmit={join} className="form">
          <label>Game Code</label>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" required />
          <label>Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
          <button className="btn" type="submit">Join</button>
        </form>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Player</h2>
      <p><strong>Game:</strong> {code}</p>
      <p><strong>Status:</strong> {game?.status}</p>
      <p><strong>Alive:</strong> {eliminated ? 'No (spectating)' : 'Yes'}</p>
      <hr />
      {round ? (
        <div>
          <h3>Round {round.index + 1}</h3>
          <p className="question">{round.question.body}</p>
          <ul className="options">
            {round.question.options.map((opt, i) => (
              <li key={i}>
                <label>
                  <input type="radio" disabled={locked || eliminated} checked={choice===i} onChange={() => setChoice(i)} />
                  {opt}
                </label>
              </li>
            ))}
          </ul>
          {!eliminated && (
            <button className="btn" disabled={choice==null || locked} onClick={submitAnswer}>
              {locked ? 'Locked' : 'Lock Answer'}
            </button>
          )}
        </div>
      ) : (
        <div className="muted">Waiting for the host to start a round…</div>
      )}
    </section>
  )
}
