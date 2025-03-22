import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Onboarding from "./pages/Onboarding"
import Flowchart from './pages/flowchart'
import "./App.css"
import { Link } from "react-router-dom"
import { useAuth } from './context/AuthContext'

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">ConceptFlow</Link>
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/flowchart" className="nav-link">Flowchart Generator</Link>
        {currentUser && (
          <>
            <span className="text-gray-700">
              {currentUser?.displayName || currentUser?.email}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

const AppRoutes = () => {
  return (
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
  )
}

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Navigation />
        <main className="main-content">
          <AppRoutes />
        </main>
        <footer className="footer">
          <p>© 2024 ConceptFlow - Created at WeHacks</p>
        </footer>
      </AuthProvider>
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





