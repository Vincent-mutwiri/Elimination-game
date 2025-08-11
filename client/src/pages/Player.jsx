import React, { useEffect, useState } from 'react'
import { socket } from '../lib/socket.js'

// Tone.js global from index.html
const playTone = (note) => {
  try {
    // eslint-disable-next-line no-undef
    if (typeof Tone !== 'undefined') {
      // eslint-disable-next-line no-undef
      if (Tone.context.state !== 'running') {
        // eslint-disable-next-line no-undef
        Tone.context.resume()
      }
      // eslint-disable-next-line no-undef
      const synth = new Tone.Synth().toDestination()
      synth.triggerAttackRelease(note, '8n')
    }
  } catch {}
}

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
    const onState = (payload) => setGame(payload)
    const onStart = (payload) => {
      setRound(payload)
      setLocked(false)
      setChoice(null)
      playTone('C4')
    }
    const onResult = (payload) => {
      const isOut = payload.eliminated.some(p => p.id === playerId)
      if (isOut) {
        setEliminated(true)
        playTone('A3')
      } else {
        playTone('G4')
      }
    }

    socket.on('game:state', onState)
    socket.on('round:start', onStart)
    socket.on('round:result', onResult)

    return () => {
      socket.off('game:state', onState)
      socket.off('round:start', onStart)
      socket.off('round:result', onResult)
    }
  }, [playerId])

  const joinGame = (e) => {
    e.preventDefault()
    socket.emit('player:join', { code: code.trim().toUpperCase(), name: name.trim() }, (res) => {
      if (res?.ok) {
        setJoined(true)
        setPlayerId(res.player.id)
        setGame(res.game)
      } else {
        alert(res?.error || 'Failed to join')
      }
    })
  }

  const submitAnswer = () => {
    if (!round || choice == null || locked) return
    setLocked(true)
    const payload = round.question.kind === 'estimate'
      ? { value: parseInt(choice) || 0 }
      : { choiceIndex: choice }
    socket.emit('player:answer', { code, roundIndex: round.index, payload })
  }

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
    )
  }

  return (
    <section className="card">
      <h2>{name}</h2>
      <p>Status: {eliminated ? 'Eliminated' : 'In the Game'}</p>
      <hr />
      {round && !eliminated ? (
        <div>
          <h3>Round {round.index + 1}</h3>
          <p className="question">{round.question.body}</p>
          {round.question.kind === 'estimate' ? (
            <div>
              <input type="number" disabled={locked} value={choice ?? ''} onChange={(e) => setChoice(e.target.value)} placeholder="Enter your estimate" />
            </div>
          ) : (
            <ul className="options">
              {round.question.options.map((opt, i) => (
                <li key={i}>
                  <label>
                    <input type="radio" name="answer" disabled={locked} checked={choice === i} onChange={() => setChoice(i)} />
                    <span>{opt}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <button className="btn" disabled={choice == null || locked} onClick={submitAnswer}>
            {locked ? 'Answer Locked' : 'Lock In'}
          </button>
        </div>
      ) : (
        <div className="muted">{game?.winner ? `Game Over! Winner: ${game.winner.name}` : 'Waiting for the next round...'}</div>
      )}
    </section>
  )
}
