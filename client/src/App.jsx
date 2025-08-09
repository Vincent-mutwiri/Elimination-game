import React from 'react'
import { Outlet, Link } from 'react-router-dom'

export default function App() {
  return (
    <div className="container">
      <header>
        <h1>Last Player Standing</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/admin">Admin</Link>
          <a href="https://github.com/" target="_blank" rel="noreferrer">Docs</a>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <small>© {new Date().getFullYear()} LPS — MVP</small>
      </footer>
    </div>
  )
}
