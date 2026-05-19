import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import ContributionGrid from "../components/ContributionGrid.jsx";

const HabitDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [habit, setHabit] = useState(null)

    useEffect(() => {
        api.get(`/api/habits/${id}`)
            .then(res => setHabit(res.data))
            .catch(err => console.log(err.message))
    }, [id])

    const markDone = () => {
        api.patch(`/api/habits/${id}/complete`)
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
        <div>
            <h1>{habit.name}</h1>
            <p>{habit.description}</p>
            <p>Streak: {habit.streak} 🔥</p>
            <button onClick={markDone} className="DoneButton">Mark as Done</button>
            <button onClick={deleteHabit} className="DeleteButton">Delete</button>
            <ContributionGrid completedDates={habit.completedDates} />
        </div>
    )
}

export default HabitDetail