import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(data => {
        setGames(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch games', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="muted">Loading games...</div>;

  return (
    <section className="card">
      <h2>Admin Dashboard</h2>
      <p>Showing the last 50 games created.</p>
      <div className="list">
        {games.map(game => (
          <Link to={`/admin/${game.code}`} key={game.code} className="list-item">
            <div>
              <strong>Code: {game.code}</strong>
              <small className="muted"> ({game.status})</small>
            </div>
            <small className="muted">
              {game.players.length} players, created at {new Date(game.createdAt).toLocaleString()}
            </small>
          </Link>
        ))}
      </div>
    </section>
  );
}
