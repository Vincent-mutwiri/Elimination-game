import React, { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApi('/api/leaderboard')
      .then(data => {
        setLeaderboard(data);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="muted">Loading leaderboard...</div>;
  if (error) return <div className="card danger"><strong>Error:</strong> {error}</div>;

  return (
    <section className="card">
      <h2>Leaderboard</h2>
      <ol className="list">
        {leaderboard.map((player, index) => (
          <li key={player._id} className="list-item">
            <span>{index + 1}. {player._id}</span>
            <span>{player.wins} wins</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
