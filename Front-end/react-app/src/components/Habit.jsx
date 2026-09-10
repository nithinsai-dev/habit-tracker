import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

const CATEGORY_STYLES = {
    Career: { bg: 'rgba(139, 124, 255, 0.18)', color: '#a89bff' },
    Health: { bg: 'rgba(34, 211, 238, 0.18)', color: '#22d3ee' },
    Fitness: { bg: 'rgba(251, 146, 60, 0.18)', color: '#fb923c' },
    Finance: { bg: 'rgba(52, 211, 153, 0.18)', color: '#34d399' },
    Learning: { bg: 'rgba(244, 114, 182, 0.18)', color: '#f472b6' },
    General: { bg: 'rgba(154, 154, 168, 0.18)', color: '#9a9aa8' },
};

function MiniStreakGrid({ last7Days = [], color }) {
    return (
        <div className="mini-streak-container">
            <span className="mini-streak-label">Last 7 days</span>
            <div className="mini-streak-grid">
                {last7Days.map((day, idx) => (
                    <div
                        key={idx}
                        title={`${day.dateStr}: ${day.completed ? 'Completed' : 'Missed'}`}
                        className={`mini-cell ${day.completed ? 'filled' : ''}`}
                        style={day.completed ? { backgroundColor: color || 'var(--accent)' } : {}}
                    />
                ))}
            </div>
        </div>
    );
}

function Habit({ habit, onToggle, onProgress, isToggling }) {
    const navigate = useNavigate();
    const category = habit.category || 'General';
    const catStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.General;
    const accentColor = habit.color || catStyle.color;

    const isNumeric = habit.targetType === 'numeric';
    const targetVal = habit.targetValue || 1;
    const currentVal = habit.todayValue || 0;
    const isDone = habit.isCompletedToday || (isNumeric && currentVal >= targetVal);
    const unit = habit.unit || (isNumeric ? 'times' : '');

    const handleToggleClick = (e) => {
        e.stopPropagation();
        if (isToggling) return;

        if (!isDone) {
            try {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.8 },
                    colors: [accentColor, '#34d399', '#f59e0b', '#ec4899']
                });
            } catch {
                // Ignore confetti error
            }
        }

        onToggle(habit._id);
    };

    const handleStep = (e, delta) => {
        e.stopPropagation();
        if (isToggling || !onProgress) return;

        const nextVal = Math.max(0, currentVal + delta);
        if (nextVal >= targetVal && currentVal < targetVal) {
            try {
                confetti({
                    particleCount: 55,
                    spread: 65,
                    origin: { y: 0.8 },
                    colors: [accentColor, '#34d399', '#fbbf24']
                });
            } catch {
                // Ignore confetti error
            }
        }

        onProgress(habit._id, delta);
    };

    const numericPercent = isNumeric
        ? Math.min(100, Math.round((currentVal / targetVal) * 100))
        : (isDone ? 100 : 0);

    return (
        <div
            className={`habit-card ${isDone ? 'habit-card-completed' : ''}`}
            onClick={() => navigate(`/habits/${habit._id}`)}
            style={{ '--habit-accent': accentColor }}
        >
            <div className="habit-card-top">
                <div className="habit-card-meta">
                    <span
                        className="category-pill"
                        style={{ background: catStyle.bg, color: catStyle.color }}
                    >
                        {category}
                    </span>
                    {habit.frequency && habit.frequency !== 'daily' && (
                        <span className="frequency-pill">{habit.frequency}</span>
                    )}
                    {habit.strengthLevel && (
                        <span className="strength-pill" title={`Habit Strength: ${habit.habitStrength || 0}%`}>
                            {habit.strengthLevel}
                        </span>
                    )}
                </div>

                {!isNumeric ? (
                    <button
                        type="button"
                        className={`check-btn ${isDone ? 'check-btn-done' : ''}`}
                        onClick={handleToggleClick}
                        disabled={isToggling}
                        title={isDone ? "Click to undo completion" : "Click to mark done for today"}
                        aria-label={isDone ? "Mark habit as incomplete" : "Mark habit as complete"}
                    >
                        {isDone ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            <span className="check-btn-empty" />
                        )}
                    </button>
                ) : (
                    <div className="numeric-stepper-control" onClick={e => e.stopPropagation()}>
                        <button
                            type="button"
                            className="step-btn step-minus"
                            onClick={(e) => handleStep(e, -1)}
                            disabled={isToggling || currentVal <= 0}
                            title="Decrease count"
                        >
                            −
                        </button>
                        <span className="step-display">
                            <strong>{currentVal}</strong> / {targetVal}
                        </span>
                        <button
                            type="button"
                            className="step-btn step-plus"
                            onClick={(e) => handleStep(e, 1)}
                            disabled={isToggling}
                            title="Increase count"
                            style={{ backgroundColor: accentColor }}
                        >
                            +
                        </button>
                    </div>
                )}
            </div>

            <div className="habit-card-body">
                <h3 className="habit-title">{habit.name}</h3>
                {habit.description && (
                    <p className="habit-desc">{habit.description}</p>
                )}

                {isNumeric && (
                    <div className="numeric-progress-wrap">
                        <div className="numeric-progress-meta">
                            <span className="numeric-unit-label">{unit}</span>
                            <span className="numeric-percent">{numericPercent}%</span>
                        </div>
                        <div className="numeric-track">
                            <div
                                className="numeric-fill"
                                style={{ width: `${numericPercent}%`, backgroundColor: accentColor }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="habit-card-footer">
                <div className="streak-stats">
                    <span className="streak-badge-active" title="Current consecutive streak">
                        🔥 {habit.streak || 0} {habit.streak === 1 ? 'day' : 'days'}
                    </span>
                    {(habit.bestStreak > 0) && (
                        <span className="streak-badge-best" title="Best streak ever">
                            🏆 Best: {habit.bestStreak}
                        </span>
                    )}
                </div>

                <MiniStreakGrid
                    last7Days={habit.last7Days || []}
                    color={accentColor}
                />
            </div>
        </div>
    );
}

export default Habit;