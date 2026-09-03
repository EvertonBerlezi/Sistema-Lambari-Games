import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import AppRoutes from './routes/AppRoutes'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
