import { useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import Dashboard from './pages/Dashboard'
import TechnicianDashboard from './pages/TechnicianDashboard'
import './App.css'

function getUserRole(user) {
  if (typeof user?.role === 'string') {
    return user.role.toLowerCase()
  }

  return user?.role?.name?.toLowerCase() || ''
}

function getDefaultPage(role) {
  if (role === 'admin') {
    return '/admin'
  }

  if (role === 'technician') {
    return '/technician'
  }

  return '/dashboard'
}

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ email, password }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || 'Login failed.')
        return
      }

      localStorage.setItem('token', data.authorization.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      const role = getUserRole(data.user)
      navigate(getDefaultPage(role))
    } catch {
      setMessage(
        'Cannot connect to the server. Make sure Laravel is running.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>IT Help Desk</h1>
        <p>Sign in to manage your support tickets</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {message && <p className="login-message">{message}</p>}
        </form>
      </section>
    </main>
  )
}

function App() {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const isLoggedIn = Boolean(token)
  const role = getUserRole(user)
  const defaultPage = getDefaultPage(role)

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoggedIn
            ? <Navigate to={defaultPage} replace />
            : <Login />
        }
      />

      <Route
        path="/dashboard"
        element={
          isLoggedIn && role === 'employee'
            ? <Dashboard />
            : <Navigate to={isLoggedIn ? defaultPage : '/'} replace />
        }
      />

      <Route
        path="/admin"
        element={
          isLoggedIn && role === 'admin'
            ? <AdminDashboard />
            : <Navigate to={isLoggedIn ? defaultPage : '/'} replace />
        }
      />

      <Route
        path="/technician"
        element={
          isLoggedIn && role === 'technician'
            ? <TechnicianDashboard />
            : <Navigate to={isLoggedIn ? defaultPage : '/'} replace />
        }
      />

      <Route
        path="*"
        element={
          <Navigate to={isLoggedIn ? defaultPage : '/'} replace />
        }
      />
    </Routes>
  )
}

export default App