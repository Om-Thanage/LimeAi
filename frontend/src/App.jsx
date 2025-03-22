import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Onboarding from "./pages/Onboarding"
import Flowchart from './pages/flowchart'
import "./App.css"
import { Link } from "react-router-dom"
import { useAuth } from './context/AuthContext'
import Podcast from "./pages/Podcast"
import App2  from "./pages/App2"

// Move Navigation component definition into the App component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ConditionalNavigation />
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

const ConditionalNavigation = () => {
  const location = useLocation();
  // Don't show navbar on root route
  if (location.pathname === '/') {
    return null;
  }
  return <Navigation />;
};

// Navigation component moved here, inside the Router context
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
      <Route path="/" element={<App2 />} />
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

          <Route path="/podcast" element={<ProtectedRoute>
            <Podcast />
          </ProtectedRoute>} />
    </Routes>
  )
}

export default App





