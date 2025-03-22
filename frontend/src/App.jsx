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





