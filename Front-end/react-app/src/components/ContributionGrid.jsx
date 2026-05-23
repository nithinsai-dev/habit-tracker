import React from "react";

const ContributionGrid = (props) => {
    const today = new Date();
    const days = [];

    for (let i = 363; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        days.push(day);
    }

    // Pad the beginning so day[0] starts on the right day-of-week column
    const firstDayOfWeek = days[0].getDay(); // 0 = Sunday
    const paddedDays = [
        ...Array(firstDayOfWeek).fill(null), // empty cells before day[0]
        ...days
    ];

    const isCompleted = (day) => {
        if (!day) return false;
        return props.completedDates.some(date =>
            new Date(date).toDateString() === day.toDateString()
        );
    };

    return (
        <div className="grid">
            {paddedDays.map((day, i) => (
                <div
                    key={i}
                    className={
                        !day
                            ? "box empty"           // padding cell
                            : isCompleted(day)
                                ? "box completed"
                                : "box"
                    }
                />
            ))}
        </div>
    );
};

export default ContributionGrid;