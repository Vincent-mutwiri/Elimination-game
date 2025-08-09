import React, { useEffect, useState } from 'react'
import { socket } from '../lib/socket.js'
import Lobby from '../components/Lobby.jsx'
import QuestionForm from '../components/QuestionForm.jsx'

export default function Host() {
  const [game, setGame] = useState(null)
  const [creating, setCreating] = useState(false)
  const [roundBusy, setRoundBusy] = useState(false)

  useEffect(() => {
    socket.on('game:state', payload => setGame(payload))
    socket.on('round:start', payload => {
      setGame(g => ({ ...g, currentRound: payload }))
    })
    socket.on('round:result', payload => {
      // merge into game state; server will also send game:state
    })
    return () => {
      socket.off('game:state')
      socket.off('round:start')
      socket.off('round:result')
    }
  }, [])

  const createGame = () => {
    setCreating(true)
    socket.emit('host:createGame', {}, (res) => {
      setCreating(false)
      if (!res?.ok) return alert(res.error || 'Failed to create game')
      setGame(res.game)
    })
  }

  const startRound = (question) => {
    if (!game) return
    setRoundBusy(true)
    socket.emit('host:startRound', { code: game.code, question }, (res) => {
      setRoundBusy(false)
      if (!res?.ok) alert(res.error || 'Failed to start round')
    })
  }

  const nextRound = () => {
    setRoundBusy(true)
    socket.emit('host:nextRound', { code: game.code }, (res) => {
      setRoundBusy(false)
      if (!res?.ok) alert(res.error || 'Failed to start next round')
    })
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
