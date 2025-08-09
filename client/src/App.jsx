import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}
