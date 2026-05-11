import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import HabitTracker from './pages/HabitTracker.jsx'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  return (
    <Routes>
      <Route path="/login" element={<Login setToken={setToken} />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={token ? <HabitTracker /> : <Navigate to="/login" />}
      />
    </Routes>
  )
}

export default App