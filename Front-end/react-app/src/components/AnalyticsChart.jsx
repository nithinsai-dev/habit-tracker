import { useState } from 'react';

const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function AnalyticsChart({ dayOfWeekStats = {}, color = 'var(--accent)', title = "Weekly Consistency Pattern" }) {
    const [hoveredDay, setHoveredDay] = useState(null);

    // Find max value to scale the bars
    const values = DAYS_ORDER.map(d => dayOfWeekStats[d] || 0);
    const maxVal = Math.max(...values, 1);
    const totalCheckins = values.reduce((sum, v) => sum + v, 0);

    return (
        <div className="analytics-chart-container">
            <div className="chart-header">
                <div className="chart-title-group">
                    <h3 className="chart-title">{title}</h3>
                    <span className="chart-subtitle">Completions by day of week</span>
                </div>
                <span className="chart-total-pill">
                    {totalCheckins} check-ins logged
                </span>
            </div>

            <div className="bar-chart">
                {DAYS_ORDER.map((day) => {
                    const count = dayOfWeekStats[day] || 0;
                    const heightPercent = Math.round((count / maxVal) * 100);
                    const isHovered = hoveredDay === day;

                    return (
                        <div
                            key={day}
                            className="chart-col"
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                        >
                            <div className="bar-wrapper">
                                {isHovered && (
                                    <div className="bar-tooltip">
                                        <strong>{count}</strong> {count === 1 ? 'check-in' : 'check-ins'}
                                    </div>
                                )}
                                <div
                                    className={`bar-fill ${count > 0 ? 'bar-filled' : 'bar-empty'}`}
                                    style={{
                                        height: `${Math.max(8, heightPercent)}%`,
                                        backgroundColor: count > 0 ? color : 'var(--cell-empty)'
                                    }}
                                />
                            </div>
                            <span className={`bar-label ${isHovered ? 'bar-label-active' : ''}`}>{day}</span>
                            <span className="bar-count-sub">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AnalyticsChart;
