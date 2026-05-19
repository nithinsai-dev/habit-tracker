import React from "react";

const ContributionGrid = (props) => {
    const days = [];
    const today = new Date();
    for (let i = 363; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        days.push(day);
    }

    const isCompleted = (day) => {
        return props.completedDates.some(date =>
            new Date(date).toDateString() === day.toDateString()
        );
    }


    return (
        <div className="grid">
            {days.map((day, i) => (
                <div
                    key={i}
                    className={isCompleted(day) ? "box completed" : "box"}
                />
            ))}
        </div>
    )
}

export default ContributionGrid;