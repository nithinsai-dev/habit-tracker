import { useState, useEffect } from 'react'
import api from "../api/axios.js";
import Habit from '../components/Habit.jsx';
import { useNavigate } from 'react-router-dom';
import Footer from "../components/Footer.jsx";
import useTheme from '../hooks/useTheme.js';

function HabitTracker() {
    const [habits, setHabits] = useState([])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('General');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [theme, setTheme] = useTheme();

    useEffect(() => {
        api.get('/api/habits')
            .then(res => setHabits(res.data))
            .finally(() => setLoading(false));
    }, []);

    const addHabit = () => {
        if (!name.trim()) return;

        api.post('/api/habits', { name, description, category })
            .then(res => {
                setHabits(prevHabits => [...prevHabits, res.data]);
                setName('');
                setDescription('');
                setCategory('General');
            })
            .catch(err => console.error("Failed to add habit", err));
    }

    const logout = () => {
        localStorage.removeItem('token')
        window.location.href = '/login'  // hard reload so App re-reads localStorage
    }

    const filtered = habits.filter(h =>
        h.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="App">
            <div className="topbar">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="theme-toggle"
                    aria-label="Toggle dark mode"
                >
                    {theme === 'dark' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                        </svg>
                    )}
                </button>
                <button onClick={logout} className="LogoutButton">Logout</button>
            </div>

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
                <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Career">Career</option>
                    <option value="Health">Health</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Finance">Finance</option>
                    <option value="Learning">Learning</option>
                    <option value="General">General</option>
                </select>
                <br />
                <button onClick={addHabit} className='addButton'>Add</button>
            </div>

            <div className="habitGridWrapper">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search habits"
                    className="search-input"
                />

                {loading ? (
                    <p className="empty-state">Loading your habits…</p>
                ) : filtered.length === 0 ? (
                    <p className="empty-state">
                        {search ? "No habits match your search." : "No habits yet — add your first one above."}
                    </p>
                ) : (
                    <div className="habit-grid">
                        {filtered.map(habit => (
                            <Habit key={habit._id}
                                id={habit._id}
                                name={habit.name}
                                streak={habit.streak}
                                completed={habit.completed}
                                description={habit.description}
                                category={habit.category}
                                entries={habit.entries}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="footer-spacer">
                <Footer />
            </div>
        </div>
    )
};

export default HabitTracker;