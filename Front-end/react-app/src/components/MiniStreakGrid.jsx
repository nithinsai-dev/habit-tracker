import React from "react";

function MiniStreakGrid({ completedDates = [] }) {
    const today = new Date();
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
    });

    return (
        <div className="mini-streak-grid">
            {last7.map(date => (
                <div
                    key={date}
                    className={`mini-cell ${completedDates.includes(date) ? 'filled' : ''}`}
                />
            ))}
        </div>
    );
}

export default MiniStreakGrid;