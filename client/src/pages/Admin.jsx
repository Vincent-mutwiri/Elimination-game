import { fetchApi } from '../lib/api';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApi('/api/games')
      .then(data => {
        setGames(data);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="muted">Loading games...</div>;
  if (error) return <div className="card danger"><strong>Error:</strong> {error}</div>;

  return (
    <section className="card">
      <h2>Admin Dashboard</h2>
      <p>Showing the last 50 games created.</p>
      <div className="list">
        {games.length > 0 ? games.map(game => (
          <Link to={`/admin/${game.code}`} key={game.code} className="list-item">
            <div>
              <strong>Code: {game.code}</strong>
              <small className="muted"> ({game.status})</small>
            </div>
            <small className="muted">
              {game.players.length} players, created at {new Date(game.createdAt).toLocaleString()}
            </small>
          </Link>
        )) : <p className="muted">No games found.</p>}
      </div>
    </section>
  );
}