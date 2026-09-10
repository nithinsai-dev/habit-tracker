import { useState } from "react";
import api from "../api/axios.js";
import { useNavigate, Link } from "react-router-dom";
import useToast from "../hooks/useToast.js";

function Login({ setToken }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/api/auth/login', {
                email: email.trim(),
                password
            });

            localStorage.setItem('token', res.data.token);
            if (res.data.email) {
                localStorage.setItem('userEmail', res.data.email);
            }
            setToken(res.data.token);
            toast.success("Welcome back! 👋");
            navigate('/');
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="brand-badge">🔥 HabitFlow</div>
                    <h1>Welcome Back</h1>
                    <p className="auth-sub">Track consistency and build lasting daily streaks</p>
                </div>

                {error && <div className="err-banner">{error}</div>}

                <form onSubmit={handleLogin} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="login-email">Email Address</label>
                        <input
                            id="login-email"
                            value={email}
                            type="email"
                            onChange={e => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            value={password}
                            type="password"
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary auth-submit"
                        disabled={loading}
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-footer-text">
                    Don't have an account? <Link to="/register" className="auth-link">Create one</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;