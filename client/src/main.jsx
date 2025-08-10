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
import { ToastContainer } from 'react-toastify';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer position="bottom-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="host" element={<Host />} />
        <Route path="play" element={<Player />} />
        <Route path="admin" element={<Admin />} />
        <Route path="admin/:code" element={<GameDetails />} />
        <Route path="leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);