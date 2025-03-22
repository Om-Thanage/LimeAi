import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Flowchart from './pages/flowchart'
import './App.css'

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div className="nav-logo">
            <Link to="/">ConceptFlow</Link>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/flowchart" className="nav-link">Flowchart Generator</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/flowchart" element={<Flowchart />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>© 2024 ConceptFlow - Created at WeHacks</p>
        </footer>
      </div>
    </Router>
  )
}

// Simple Home component
const Home = () => {
  return (
    <div className="home-container">
      <h1>Welcome to ConceptFlow</h1>
      <p>Visualize complex concepts with AI-generated flowcharts</p>
      <div className="cta-button">
        <Link to="/flowchart">
          Create Flowchart
        </Link>
      </div>
    </div>
  )
}

export default App