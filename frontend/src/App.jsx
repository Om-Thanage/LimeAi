import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Onboarding from "./pages/Onboarding"
import Flowchart from './pages/flowchart'
import Podcast from "./pages/Podcast"
import Summary from "./pages/Summary"
import Whiteboard from "./pages/Whiteboard"
import Landing from "./pages/Landing"

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
      <Route path="/whiteboard" element={<Whiteboard />} />
      <Route path="/summary" element={<Summary />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Landing />} />
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





