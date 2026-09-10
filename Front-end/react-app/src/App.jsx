import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import HabitTracker from './pages/HabitTracker.jsx';
import HabitDetail from './pages/HabitDetail.jsx';
import { ToastProvider } from './components/Toast.jsx';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ToastProvider>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <Login setToken={setToken} />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/" replace /> : <Register setToken={setToken} />}
        />
        <Route
          path="/habits/:id"
          element={token ? <HabitDetail /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={token ? <HabitTracker setToken={setToken} /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;