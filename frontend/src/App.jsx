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
import Summary from "./pages/Summary"

// Move Navigation component definition into the App component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <main className="main-content">
          <AppRoutes />
        </main>
      </AuthProvider>
    </Router>
  )
}



const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/summary" element={<Summary />} />
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





