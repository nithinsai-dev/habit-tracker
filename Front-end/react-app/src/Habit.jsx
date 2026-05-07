import React from "react";

function Habit(props) {

    console.log('habit props:', props.name, props.streak, props.completed)

    return (
        <div className="Habit">
            <h1 style={{ color: 'blue' }}>{props.name}</h1>
            <p>This is a simple habit.</p>
            <p>{props.name} — Streak: {props.streak} 🔥</p>
            <button onClick={() => props.onMarkDone([props.id])} className="DoneButton">
                Mark as Done
            </button>
        </div>
    )
}

export default Habit;