import React from "react";

function Habit(props) {
    return (
        <div className="Habit">
            <h1>{props.name}</h1>
            <p>{props.description}</p>

            <div className="streak-badge">
                {props.name} — Streak: {props.streak} 🔥
            </div>

            <button onClick={() => props.onMarkDone(props.id)} className="DoneButton">
                Mark as Done
            </button>
            <button
                onClick={() => props.onDelete(props.id)}
                className="DeleteButton"
            >
                delete
            </button>
        </div>
    )
}

export default Habit;