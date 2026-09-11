import { useState, useMemo } from "react";

const ContributionGrid = ({ entries = [], color = "#8b7cff", onComplete, frequency = 'daily' }) => {
    const [selectedDay, setSelectedDay] = useState(null);
    const [noteInput, setNoteInput] = useState("");
    const [tooltip, setTooltip] = useState(null);

    const today = useMemo(() => new Date(), []);
    const year = today.getFullYear();

    // Map of 'YYYY-MM-DD' => entry
    const entryMap = useMemo(() => {
        const map = new Map();
        entries.forEach(e => {
            if (!e) return;
            let dStr = e.dateStr;
            if (!dStr && e.date) {
                const d = new Date(e.date);
                if (!isNaN(d.getTime())) {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const dayNum = String(d.getDate()).padStart(2, '0');
                    dStr = `${y}-${m}-${dayNum}`;
                }
            }
            if (dStr) {
                map.set(dStr, e);
            }
        });
        return map;
    }, [entries]);

    // Build the 52+ week calendar grid
    const { days, totalWeeks, monthLabels } = useMemo(() => {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);

        // Align to start of week (Sunday = 0)
        const startDate = new Date(yearStart);
        startDate.setDate(yearStart.getDate() - yearStart.getDay());

        // Align to end of week (Saturday = 6)
        const endDate = new Date(yearEnd);
        endDate.setDate(yearEnd.getDate() + (6 - yearEnd.getDay()));

        const dayList = [];
        const current = new Date(startDate);

        const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        while (current <= endDate) {
            const d = new Date(current);
            const curMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());

            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dayNum = String(d.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dayNum}`;
            const dayOfWeek = d.getDay();

            const isScheduled = !frequency || frequency === 'daily' ||
                (frequency === 'weekdays' && dayOfWeek >= 1 && dayOfWeek <= 5) ||
                (frequency === 'weekends' && (dayOfWeek === 0 || dayOfWeek === 6));

            dayList.push({
                date: d,
                dateStr,
                inYear: d.getFullYear() === year,
                isToday: curMid.getTime() === todayMid.getTime(),
                isFuture: curMid.getTime() > todayMid.getTime(),
                isScheduled
            });

            current.setDate(current.getDate() + 1);
        }

        const weeksCount = Math.ceil(dayList.length / 7);
        const months = [];

        for (let w = 0; w < weeksCount; w++) {
            const week = dayList.slice(w * 7, w * 7 + 7);
            const firstOfMonth = week.find(d => d.inYear && d.date.getDate() <= 7 && d.date.getDate() === 1);
            if (firstOfMonth) {
                months.push({
                    week: w,
                    name: firstOfMonth.date.toLocaleString('default', { month: 'short' })
                });
            }
        }

        return { days: dayList, totalWeeks: weeksCount, monthLabels: months };
    }, [year, today, frequency]);

    const handleCellClick = (day) => {
        if (!day.inYear || day.isFuture) return;
        const entry = entryMap.get(day.dateStr);
        setSelectedDay(day);
        setNoteInput(entry?.note || "");
    };

    const handleSaveNote = () => {
        if (onComplete && selectedDay) {
            onComplete(noteInput, selectedDay.date);
        }
        setSelectedDay(null);
    };

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="contribution-grid-container">
            <div className="grid-scroll-wrapper">
                {/* Month labels header */}
                <div
                    className="grid-months-row"
                    style={{ gridTemplateColumns: `repeat(${totalWeeks}, 14px)` }}
                >
                    {monthLabels.map(m => (
                        <span
                            key={m.week}
                            className="grid-month-label"
                            style={{ gridColumnStart: m.week + 1 }}
                        >
                            {m.name}
                        </span>
                    ))}
                </div>

                <div className="grid-body-wrapper">
                    {/* Weekday indicators */}
                    <div className="grid-day-labels">
                        {dayLabels.map((lbl, idx) => (
                            <span key={idx} className="grid-day-label">
                                {idx % 2 === 1 ? lbl : ''}
                            </span>
                        ))}
                    </div>

                    {/* Heatmap grid */}
                    <div
                        className="grid-cells"
                        style={{ gridTemplateColumns: `repeat(${totalWeeks}, 14px)` }}
                    >
                        {days.map((day, i) => {
                            const entry = entryMap.get(day.dateStr);
                            const isDone = !!entry;

                            let cellClass = "grid-cell";
                            if (!day.inYear) cellClass += " outside-year";
                            else if (day.isFuture) cellClass += " future";
                            else if (isDone) cellClass += " completed";
                            else if (!day.isScheduled) cellClass += " rest-day";
                            if (day.isToday) cellClass += " today";

                            let statusText = 'Not completed';
                            if (isDone) {
                                statusText = entry?.note ? `Completed ("${entry.note}")` : (entry?.isFreeze ? 'Streak Protected ❄️' : 'Completed');
                            } else if (day.isFuture) {
                                statusText = 'Future';
                            } else if (!day.isScheduled) {
                                statusText = 'Rest day (Not scheduled)';
                            }

                            return (
                                <div
                                    key={i}
                                    className={cellClass}
                                    style={isDone ? { backgroundColor: color, borderColor: color } : {}}
                                    onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setTooltip({
                                            text: `${day.date.toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}: ${statusText}`,
                                            x: rect.left + window.scrollX,
                                            y: rect.top + window.scrollY - 30
                                        });
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                    onClick={() => handleCellClick(day)}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="grid-floating-tooltip"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    {tooltip.text}
                </div>
            )}

            {/* Legend */}
            <div className="grid-legend">
                <span className="legend-label">Less</span>
                <div className="legend-cell empty" />
                <div className="legend-cell filled" style={{ backgroundColor: color }} />
                <span className="legend-label">More</span>
            </div>

            {/* Day Inspection / Note Modal */}
            {selectedDay && (
                <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedDay.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                            <button className="modal-close-btn" onClick={() => setSelectedDay(null)}>✕</button>
                        </div>

                        <div className="modal-body">
                            {entryMap.has(selectedDay.dateStr) ? (
                                <div className="entry-details">
                                    <div className="status-badge success">
                                        <span className="badge-check">✓</span>
                                        <span>Completed on this day</span>
                                    </div>
                                    <div className="note-display">
                                        <span className="note-label">Attached Reflection / Note:</span>
                                        <div className="note-content">
                                            {entryMap.get(selectedDay.dateStr)?.note ? (
                                                <p className="note-quote">“{entryMap.get(selectedDay.dateStr).note}”</p>
                                            ) : (
                                                <p className="note-placeholder">No reflection note attached for this check-in.</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setSelectedDay(null)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : selectedDay.isToday ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSaveNote();
                                    }}
                                    className="entry-create-form"
                                >
                                    <div className="day-modal-prompt">
                                        <span className="prompt-icon">💡</span>
                                        <p>You haven't completed this habit for today yet. Check it off below with an optional reflection.</p>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="modal-note-input">Reflection or Note (Optional)</label>
                                        <textarea
                                            id="modal-note-input"
                                            value={noteInput}
                                            onChange={(e) => setNoteInput(e.target.value)}
                                            placeholder="e.g. Completed 20-min session, felt great focus today..."
                                            rows={3}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setSelectedDay(null)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            style={{ backgroundColor: color }}
                                        >
                                            ✓ Mark Done with Note
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="entry-empty">
                                    <div className="empty-calendar-icon">📅</div>
                                    <p className="empty-calendar-text">No check-in was recorded for this past day.</p>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setSelectedDay(null)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContributionGrid;