import { useNavigate } from 'react-router-dom'

const CATEGORY_STYLES = {
    Career: { bg: 'rgba(139, 124, 255, 0.18)', color: '#a89bff' },
    Health: { bg: 'rgba(34, 211, 238, 0.18)', color: '#22d3ee' },
    Fitness: { bg: 'rgba(251, 146, 60, 0.18)', color: '#fb923c' },
    Finance: { bg: 'rgba(52, 211, 153, 0.18)', color: '#34d399' },
    Learning: { bg: 'rgba(244, 114, 182, 0.18)', color: '#f472b6' },
    General: { bg: 'rgba(154, 154, 168, 0.18)', color: '#9a9aa8' },
}

function MiniStreakGrid({ entries = [], color }) {

    const completedDates = entries.map(e =>
        new Date(e.date).toISOString().split('T')[0]
    );

    const today = new Date()
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
    })

    return (
        <div className="mini-streak-grid">
            {last7.map(date => (
                <div
                    key={date}
                    className={`mini-cell ${completedDates.includes(date) ? 'filled' : ''}`}
                    style={completedDates.includes(date) ? { backgroundColor: color } : {}}
                />
            ))}
        </div>
    )
}

function Habit(props) {
    const navigate = useNavigate()
    const category = props.category || 'General'
    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.General

    return (
        <div className="Habit" onClick={() => navigate(`/habits/${props.id}`)}>
            <div className="icon-chip" style={{ background: style.bg, color: style.color }}>
                {category.charAt(0).toUpperCase()}
            </div>
            <span className="habit-tag">{category}</span>
            <h3>{props.name}</h3>
            <p>{props.description}</p>
            <div className="streak-badge">
                Streak: {props.streak} 🔥
            </div>
            <MiniStreakGrid entries={props.entries} color={style.color} />
        </div>
    )
}

export default Habit