import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import Host from './pages/Host.jsx';
import Player from './pages/Player.jsx';
import Admin from './pages/Admin.jsx';
import GameDetails from './pages/GameDetails.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="host" element={<Host />} />
          <Route path="play" element={<Player />} />
          <Route path="admin" element={<Admin />} />
          <Route path="admin/:code" element={<GameDetails />} />
          <Route path="leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);