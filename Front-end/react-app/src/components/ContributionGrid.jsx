import React, { useState } from "react";

const ContributionGrid = (props) => {
    const entries = props.entries || [];
    const onComplete = props.onComplete; // function(note) passed from HabitDetail
    const today = new Date();
    const year = today.getFullYear();

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const startDate = new Date(yearStart);
    startDate.setDate(yearStart.getDate() - yearStart.getDay());

    const endDate = new Date(yearEnd);
    endDate.setDate(yearEnd.getDate() + (6 - yearEnd.getDay()));

    // Each day is now an object, not a raw Date — carries whether it's
    // actually in the selected year (vs padding) and whether it's future.
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
        const d = new Date(current);
        days.push({
            date: d,
            inYear: d.getFullYear() === year,
            isFuture: d > today,
        });
        current.setDate(current.getDate() + 1);
    }

    // Month label row: walk the days in chunks of 7 (one chunk = one column),
    // and record where each month's 1st actually falls.
    const totalWeeks = Math.ceil(days.length / 7);
    const monthLabels = [];
    for (let w = 0; w < totalWeeks; w++) {
        const week = days.slice(w * 7, w * 7 + 7);
        const firstOfMonth = week.find(d => d.inYear && d.date.getDate() === 1);
        if (firstOfMonth) {
            monthLabels.push({ week: w, name: firstOfMonth.date.toLocaleString('default', { month: 'short' }) });
        }
    }

    const getEntry = (day) =>
        entries.find(e => e?.date && new Date(e.date).toDateString() === day.date.toDateString());

    const isToday = (day) => day.date.toDateString() === today.toDateString();

    const [selectedDay, setSelectedDay] = useState(null);
    const [noteInput, setNoteInput] = useState("");

    const handleDayClick = (day) => {
        if (!day.inYear || day.isFuture) return; // locked, do nothing
        setSelectedDay(day);
        setNoteInput("");
    };

    const handleSubmitNote = () => {
        onComplete(noteInput);
        setSelectedDay(null);
    };

    return (
        <>
            <div className="month-labels" style={{ display: "grid", gridTemplateColumns: `repeat(${totalWeeks}, 12px)`, gap: "4px", marginBottom: "4px" }}>
                {monthLabels.map(m => (
                    <span key={m.week} style={{ gridColumnStart: m.week + 1, fontSize: "12px" }}>{m.name}</span>
                ))}
            </div>

            <div className="grid">
                {days.map((day, i) => {
                    let className = "box";
                    if (!day.inYear) className = "box outside-year";
                    else if (day.isFuture) className = "box future";
                    else if (getEntry(day)) className = "box completed";

                    return (
                        <div
                            key={i}
                            className={className}
                            title={day.date.toDateString()}
                            onClick={() => handleDayClick(day)}
                        />
                    );
                })}
            </div>

            {selectedDay && (
                <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h4>{selectedDay.date.toDateString()}</h4>
                        {getEntry(selectedDay) ? (
                            <p>{getEntry(selectedDay).note || "No note added."}</p>
                        ) : isToday(selectedDay) ? (
                            <>
                                <textarea
                                    value={noteInput}
                                    onChange={(e) => setNoteInput(e.target.value)}
                                    placeholder="Add a note (optional)"
                                />
                                <button onClick={handleSubmitNote} className="DoneButton">Mark Complete</button>
                            </>
                        ) : (
                            <p>Not completed.</p>
                        )}
                        <button onClick={() => setSelectedDay(null)} className="DeleteButton" >Close</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ContributionGrid;