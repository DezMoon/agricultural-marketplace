import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProduceList from './components/ProduceList';
import Register from './components/Register';
import Login from './components/Login';
import './App.css';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Produce Listings</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
          </ul>
        </nav>

        <div className="produce-listings-container">
          <Routes>
            <Route path="/" element={<ProduceList />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>

        <footer>
          <p>&copy; 2025 Agricultural Marketplace</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
