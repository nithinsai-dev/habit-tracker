import React from "react";

function Habit(props) {
    return (
        <div style={{ backgroundColor: 'lightgray', padding: '10px', margin: '10px', border: '1px solid black', borderRadius: '5px' }}>
            <h1 style={{ color: 'blue', textDecoration: 'underline' }}>{props.name}</h1>
            <p>This is a simple habit.</p>
        </div>
    )
}

export default Habit;