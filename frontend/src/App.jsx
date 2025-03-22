import React from "react"
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom"
import Flowchart from "./pages/flowchart"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Onboarding from "./pages/Onboarding"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import "./App.css"

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <nav className="navbar">
            <div className="nav-logo">
              <Link to="/home">ConceptFlow</Link>
            </div>
            <div className="nav-links">
              <Link to="/home" className="nav-link">Home</Link>
              <Link to="/flowchart" className="nav-link">Flowchart Generator</Link>
            </div>
          </nav>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/flowchart" element={
                <ProtectedRoute>
                  <Flowchart />
                </ProtectedRoute>
              } />
            </Routes>
          </main>

          <footer className="footer">
            <p>© 2024 ConceptFlow - Created at WeHacks</p>
          </footer>
        </div>
      </AuthProvider>
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