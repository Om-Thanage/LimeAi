import React, { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom"
import Flowchart from "./pages/flowchart"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Onboarding from "./pages/Onboarding"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import "./App.css"

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Navigation />

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

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to={currentUser ? "/dashboard" : "/"}>
          <span className="logo-text">ConceptFlow</span>
        </Link>
      </div>
      <div className="nav-links">
        {currentUser ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/flowchart" className="nav-link">Flowchart Generator</Link>
            <button
              onClick={logout}
              className="nav-button"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/home" className="nav-link">Home</Link>
            <Link to="/login" className="nav-link">Sign In</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default App