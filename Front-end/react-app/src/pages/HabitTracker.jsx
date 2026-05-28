import { useState, useEffect } from 'react'
import api from "../api/axios.js";
import Habit from '../components/Habit.jsx';
import { useNavigate } from 'react-router-dom';
import Footer from "../components/Footer.jsx";

function HabitTracker() {
    const [habits, setHabits] = useState([])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('');
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

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

    const filtered = habits.filter(h =>
        h.name.toLowerCase().includes(search.toLocaleLowerCase())
    )

    return (
        <div className="App">
            <button onClick={logout} className="DeleteButton">Logout</button>
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

            <div className="habitGridWrapper">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="🔍 search habits"
                    className="w-full max-w-md mx-auto block px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />

                <div className="habit-grid">
                    {filtered.map(habit => (
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
            </div>

            <div style={{ marginTop: "15%" }}>
                <Footer />
            </div>
        </div>
    )
};


export default HabitTracker;