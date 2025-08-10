import React from 'react'

export default function Lobby({ players }) {
  return (
    <div className="card">
      <h3>Lobby ({players.length})</h3>
      <ul className="list">
        {players.map(p => (
          <li key={p.id}>
            <div>
              <span className={p.isAlive ? 'pill alive' : 'pill dead'}>{p.isAlive ? 'Alive' : 'Out'}</span>
              {' '}<strong>{p.name}</strong>
              <small className="muted"> Score: {p.score || 0}</small>
            </div>
            {p.powerUps && p.powerUps.length > 0 && (
              <div className="power-ups-display">
                {p.powerUps.map((pu, i) => (
                  <span key={i} className={`pill ${pu.used ? 'used' : 'available'}`}>
                    {pu.name}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
