import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="card">
      <h2>Start</h2>
      <p>Host a new game or join as a player.</p>
      <div className="actions">
        <Link className="btn" to="/host">Host Game</Link>
        <Link className="btn secondary" to="/play">Join Game</Link>
      </div>
    </section>
  )
}
