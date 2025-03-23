import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Landing from "./pages/Landing"
import Onboarding from "./pages/Onboarding"

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
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Landing />} />   
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
    </Routes>
  )
}

export default App





