import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import ContributionGrid from "../components/ContributionGrid.jsx";
import Footer from "../components/Footer.jsx";

const HabitDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [habit, setHabit] = useState(null)

    useEffect(() => {
        api.get(`/api/habits/${id}`)
            .then(res => setHabit(res.data))
            .catch(err => console.log(err.message))
    }, [id])

    const markDone = (note) => {
        api.patch(`/api/habits/${id}/complete`, { note })
            .then(res => setHabit(res.data))
            .catch(err => {
                if (err.response?.status === 400) alert("Already done today!")
            })
    }

    const deleteHabit = () => {
        api.delete(`/api/habits/${id}`)
            .then(() => navigate('/'))
            .catch(err => console.log(err.message))
    }

    if (!habit) return <p>Loading...</p>

    return (
        <div className="detail-container">
            <button onClick={() => navigate('/')} className="back-btn">← Back</button>
            <div className="detail-header">
                <h1>{habit.name}</h1>
                <p className="detail-description">{habit.description}</p>
                <div className="streak-display">
                    🔥 {habit.streak} day streak
                </div>
            </div>

            <div className="grid-section">
                <h3>Contribution History</h3>
                <ContributionGrid entries={habit.entries} onComplete={markDone} />
            </div>

            <div className="detail-actions">
                <button onClick={() => markDone('')} className="DoneButton">Mark as Done</button>
                <button onClick={deleteHabit} className="DeleteButton">Delete Habit</button>
            </div>
            <Footer />
        </div>
    )
}

export default HabitDetail