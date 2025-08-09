import { fetchApi } from '../lib/api';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function GameDetails() {
  const { code } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApi(`/api/games/${code}`)
      .then(data => {
        setGame(data);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  if (loading) return <div className="muted">Loading game details...</div>;
  if (error) return <div className="card danger"><strong>Error:</strong> {error}</div>;
  if (!game) return <div className="card danger">Game not found.</div>;

  return (
    <section className="card">
      <h2>Game: {code}</h2>
      <div className="grid">
        <div>
          <p><strong>Status:</strong> {game.status}</p>
          <p><strong>Winner:</strong> {game.winner?.name || 'N/A'}</p>
          <p><strong>Pot:</strong> {game.pot}</p>
        </div>
        <div>
          <p><strong>Created:</strong> {new Date(game.createdAt).toLocaleString()}</p>
          <p><strong>Last Update:</strong> {new Date(game.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      <hr />

      <h3>Players ({game.players.length})</h3>
      <ul className="list">
        {game.players.map(p => (
          <li key={p.id}>
            <span className={p.isAlive ? 'pill alive' : 'pill dead'}>{p.isAlive ? 'Alive' : 'Out'}</span>
            {' '}{p.name}
          </li>
        ))}
      </ul>
    </section>
  );
}