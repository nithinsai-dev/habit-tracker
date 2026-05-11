import { useState } from 'react'
import api from "../api/axios.js";
import { useNavigate, Link } from 'react-router-dom'

function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleRegister = () => {
        api.post('http://localhost:3000/api/auth/register', { email, password })
            .then(res => {
                navigate('/login') // after register, go to login
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Registration failed')
            })
    }

    return (
        <div className="auth-container">
            <h1>Register</h1>
            {error && <p className="err">{error}</p>}
            <input value={email} type="email" onChange={e => setEmail(e.target.value)} placeholder="Enter Email" />
            <input value={password} type="password" onChange={e => setPassword(e.target.value)} placeholder="Enter Password" />
            <button onClick={handleRegister} className="addButton">Register</button>
            <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
    )
}

export default Register