import { useNavigate } from 'react-router-dom'

function Habit(props) {
    const navigate = useNavigate()

    return (
        <div className="Habit" onClick={() => navigate(`/habits/${props.id}`)}>
            <h1>{props.name}</h1>
            <p>{props.description}</p>
            <div className="streak-badge">
                Streak: {props.streak} 🔥
            </div>
        </div>
    )
}

export default Habit