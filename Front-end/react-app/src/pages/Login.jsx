import { useState } from "react";
import api from "../api/axios.js";
import { useNavigate, Link } from "react-router-dom";

function Login({ setToken }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        api.post('/api/auth/login', { email, password })
            .then(res => {
                localStorage.setItem('token', res.data.token);
                setToken(res.data.token);
                navigate('/');
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Login Failed');
            })
    }

    return (
        <div className="auth-container">
            <h1>Login</h1>
            {error && <p className="err">{error}</p>}
            <input value={email} type="email" onChange={e => setEmail(e.target.value)} placeholder="Enter Email" />
            <input value={password} type="password" onChange={e => setPassword(e.target.value)} placeholder="Enter Password" />
            <button onClick={handleLogin} className="addButton">Login</button>
            <p>Dont Have an Account? <Link to="/register">Register</Link></p>
        </div>
    )
}

export default Login;