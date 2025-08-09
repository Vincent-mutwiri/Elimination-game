import React from 'react'

export default function Lobby({ players }) {
  return (
    <div className="card">
      <h3>Lobby</h3>
      <ul className="list">
        {players.map(p => (
          <li key={p.id}>
            <span className={p.isAlive ? 'pill alive' : 'pill dead'}>{p.isAlive ? 'Alive' : 'Out'}</span>
            {' '}{p.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
