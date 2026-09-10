import { useState } from 'react';
import api from "../api/axios.js";
import { useNavigate, Link } from 'react-router-dom';
import useToast from "../hooks/useToast.js";

function Register({ setToken }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please fill in all fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/api/auth/register', {
                email: email.trim(),
                password
            });

            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                if (res.data.email) {
                    localStorage.setItem('userEmail', res.data.email);
                }
                if (setToken) setToken(res.data.token);
                toast.success("Account created successfully! Welcome 🎉");
                navigate('/');
            } else {
                toast.success("Registration successful! Please log in.");
                navigate('/login');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
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
                    <h1>Create an Account</h1>
                    <p className="auth-sub">Start your consistency journey with GitHub-style heatmaps</p>
                </div>

                {error && <div className="err-banner">{error}</div>}

                <form onSubmit={handleRegister} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="reg-email">Email Address</label>
                        <input
                            id="reg-email"
                            value={email}
                            type="email"
                            onChange={e => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-password">Password (min 6 chars)</label>
                        <input
                            id="reg-password"
                            value={password}
                            type="password"
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Create a strong password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-confirm-password">Confirm Password</label>
                        <input
                            id="reg-confirm-password"
                            value={confirmPassword}
                            type="password"
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary auth-submit"
                        disabled={loading}
                    >
                        {loading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer-text">
                    Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;