import { useState, useEffect } from 'react'
import api from "../api/axios.js";
import Habit from '../components/Habit.jsx';
import { useNavigate } from 'react-router-dom';

function HabitTracker() {
    const [habits, setHabits] = useState([])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('');
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/api/habits')
            .then(res => setHabits(res.data))
    }, []);

    const addHabit = () => {
        if (!name.trim()) return;

        api.post('/api/habits', { name, description })
            .then(res => {
                setHabits(prevHabits => [...prevHabits, res.data]);
                setName('');
                setDescription('');
            })
            .catch(err => console.error("Failed to add habit", err));
    }

    const logout = () => {
        localStorage.removeItem('token')
        window.location.href = '/login'  // hard reload so App re-reads localStorage
    }

    return (
        <div className="App">
            <h1>Habit Tracker</h1>
            <div className="input-section">
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter habit"
                />
                <input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Enter description (optional)"
                />
                <br />
                <button onClick={addHabit} className='addButton'>Add</button>
            </div>

            <div className="habit-grid">
                {habits.map(habit => (
                    <Habit key={habit._id}
                        id={habit._id}
                        name={habit.name}
                        streak={habit.streak}
                        completed={habit.completed}
                        description={habit.description}
                        completedDates={habit.completedDates}
                    />
                ))}
            </div>

            <button onClick={logout} className="DeleteButton">Logout</button>
        </div>
    )
}


export default HabitTracker;