import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../views/Login'
import Home from '../views/Home'
import { useAuth } from '../auth/AuthContext'

function RotaPrivada({ children }) {
  const { logado } = useAuth()
  return logado ? children : <Navigate to="/" />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/home"
        element={
          <RotaPrivada>
            <Home />
          </RotaPrivada>
        }
      />
    </Routes>
  )
}
