import { useState, useEffect } from 'react'
import api from "../api/axios.js";
import Habit from '../components/Habit.jsx';

function HabitTracker() {
    const [habits, setHabits] = useState([])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('');

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

    const addStreak = (id) => {
        api.patch(`/api/habits/${id}/complete`)
            .then(res => {
                setHabits(prev => prev.map(habit =>
                    habit._id === id ? res.data : habit
                ))
            })
            .catch(err => {
                if (err.response?.status === 400) {
                    alert("Already done for today");
                } else {
                    console.log("Update Failed : ", err.message);
                }
            });
    }


    const deleteHabit = (id) => {
        api.delete(`/api/habits/${id}`)
            .then(res => {
                setHabits(prev => prev.filter(habit => habit._id !== id));
            })
            .catch(err => console.log("delete failed : ", err.message));
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
                        onMarkDone={addStreak}
                        completed={habit.completed}
                        onDelete={deleteHabit}
                        description={habit.description}
                    />
                ))}
            </div>

            <button onClick={logout} className="DeleteButton">Logout</button>
        </div>
    )
}


export default HabitTracker;