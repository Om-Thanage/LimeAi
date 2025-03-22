import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Onboarding from "./pages/Onboarding"
import Flowchart from './pages/flowchart'
import "./App.css"

const AppRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<div>Register Page</div>} />
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/flowchart" element={<ProtectedRoute>
              <Flowchart />
            </ProtectedRoute>} />
      </Routes>
      
    </AuthProvider>
  )
}

const App = () => {
  return (
    <Router>
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
          <AppRoutes />
        </main>
      <footer className="footer">
        <p>© 2024 ConceptFlow - Created at WeHacks</p>
      </footer>
    </Router>
  )
}


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
  )};

export default App





