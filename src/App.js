import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import styled from 'styled-components';
import Dashboard from './components/Dashboard';
import History from './components/History';

const Nav = styled.nav`
  background: #333;
  padding: 1rem;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  border-radius: 4px;
  &:hover {
    background: #444;
  }
  &.active {
    background: #555;
  }
`;

function App() {
  return (
    <Router>
      <Nav>
        <NavLink to="/">Tableau de Bord</NavLink>
        <NavLink to="/history">Historique</NavLink>
      </Nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}

export default App;
