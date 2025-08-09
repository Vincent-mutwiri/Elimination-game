import React, { useEffect, useState } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/leaderboard`)
      .then(res => res.json())
      .then(data => {
        setPlayers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch leaderboard', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="muted">Loading leaderboard...</div>;

  return (
    <section className="card">
      <h2>Leaderboard</h2>
      <p>Top 10 players by wins</p>
      <ol>
        {players.map(p => (
          <li key={p._id}>{p._id} - {p.wins} wins</li>
        ))}
      </ol>
    </section>
  );
}