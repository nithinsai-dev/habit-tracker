import React from "react";

const ContributionGrid = (props) => {
    const completedDates = props.completedDates || [];
    const today = new Date();

    // Find the most recent Sunday (start of current week)
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay())); // go to Saturday of this week

    // Go back exactly 52 weeks from that Saturday
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 363);

    // Build days from startDate to endDate
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    const isCompleted = (day) => {
        if (!day) return false;
        return completedDates.some(date => {
            if (!date) return false;
            return new Date(date).toDateString() === day.toDateString();
        });
    };

    return (
        <div className="grid">
            {days.map((day, i) => (
                <div
                    key={i}
                    className={isCompleted(day) ? "box completed" : "box"}
                />
            ))}
        </div>
    );
};

export default ContributionGrid;