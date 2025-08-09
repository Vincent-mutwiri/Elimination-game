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
  const [emotes, setEmotes] = useState([])
  const [player, setPlayer] = useState(null)

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
    socket.on('game:emote', payload => {
      setEmotes(prev => [...prev.slice(-4), payload])
      setTimeout(() => setEmotes(prev => prev.slice(1)), 3000)
    })
    return () => {
      socket.off('game:state')
      socket.off('round:start')
      socket.off('round:result')
    }
  }, [playerId])

  const join = (e) => {
    e.preventDefault()
    if (!code || !name) {
      return alert('Please enter both game code and your name')
    }
    
    console.log('Attempting to join game with code:', code)
    
    socket.emit('player:join', { 
      code: code.trim().toUpperCase(), 
      name: name.trim() 
    }, (res) => {
      console.log('Join response:', res)
      
      if (!res) {
        return alert('No response from server. Please try again.')
      }
      
      if (!res.ok) {
        return alert(res.error || 'Failed to join game. Please check the code and try again.')
      }
      
      if (!res.player || !res.player.id) {
        console.error('Invalid player data in response:', res)
        return alert('Invalid player data received from server. Please try again.')
      }
      
      setJoined(true)
      setPlayerId(res.player.id)
      setPlayer(res.player)
      setGame(res.game || {})
      console.log('Successfully joined game as player:', res.player.id)
    })
  }

  const submitAnswer = () => {
    if (!round || choice == null || locked) return
    setLocked(true)
    const payload = round.question.kind === 'estimate' 
      ? { value: parseInt(choice) || 0 }
      : { choiceIndex: choice }
    socket.emit('player:answer', {
      code,
      roundIndex: round.index,
      payload
    }, (res) => {
      // lock regardless; server decides correctness
    })
  }

  const usePowerUp = (powerUpName) => {
    socket.emit('player:usePowerUp', { code, powerUpName }, (res) => {
      if (!res.ok) alert(res.error)
    })
  }

  const sendEmote = (emote) => {
    socket.emit('player:sendEmote', { code, emote })
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
      <p><strong>Score:</strong> {player?.score || 0}</p>
      
      {!eliminated && player?.powerUps && (
        <div className="power-ups">
          <h4>Power-ups:</h4>
          {player.powerUps.map((pu, i) => (
            <button key={i} disabled={pu.used} onClick={() => usePowerUp(pu.name)}>
              {pu.name} {pu.used ? '(Used)' : ''}
            </button>
          ))}
        </div>
      )}
      
      <div className="emotes">
        <button onClick={() => sendEmote('😂')}>😂</button>
        <button onClick={() => sendEmote('👍')}>👍</button>
        <button onClick={() => sendEmote('🤔')}>🤔</button>
        <button onClick={() => sendEmote('😱')}>😱</button>
      </div>
      
      {emotes.length > 0 && (
        <div className="emote-display">
          {emotes.map((e, i) => <span key={i}>{e.emote}</span>)}
        </div>
      )}
      
      <hr />
      {round ? (
        <div>
          <h3>Round {round.index + 1}</h3>
          <p className="question">{round.question.body}</p>
          {round.question.kind === 'estimate' ? (
            <div>
              <input 
                type="number" 
                disabled={locked || eliminated} 
                value={choice || ''} 
                onChange={(e) => setChoice(e.target.value)}
                placeholder="Enter your estimate"
              />
            </div>
          ) : (
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
          )}
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
