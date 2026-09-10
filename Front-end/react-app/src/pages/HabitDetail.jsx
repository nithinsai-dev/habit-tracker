import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import ContributionGrid from "../components/ContributionGrid.jsx";
import AnalyticsChart from "../components/AnalyticsChart.jsx";
import Footer from "../components/Footer.jsx";
import useTheme from '../hooks/useTheme.js';
import useToast from "../hooks/useToast.js";
import confetti from 'canvas-confetti';

const COLOR_PRESETS = ['#8b7cff', '#22d3ee', '#fb923c', '#34d399', '#f472b6', '#f59e0b', '#ec4899'];
const UNIT_PRESETS = ['glasses', 'pages', 'mins', 'steps', 'km', 'times'];

const HabitDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    useTheme();

    const [habit, setHabit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [freezing, setFreezing] = useState(false);

    // Edit modal states
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editCat, setEditCat] = useState('General');
    const [editColor, setEditColor] = useState('#8b7cff');
    const [editFreq, setEditFreq] = useState('daily');
    const [editTargetType, setEditTargetType] = useState('boolean');
    const [editTargetValue, setEditTargetValue] = useState(1);
    const [editUnit, setEditUnit] = useState('glasses');
    const [saving, setSaving] = useState(false);

    // Delete confirmation modal
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let isMounted = true;
        api.get(`/api/habits/${id}`)
            .then(res => {
                if (isMounted) {
                    setHabit(res.data);
                    setEditName(res.data.name);
                    setEditDesc(res.data.description || '');
                    setEditCat(res.data.category || 'General');
                    setEditColor(res.data.color || '#8b7cff');
                    setEditFreq(res.data.frequency || 'daily');
                    setEditTargetType(res.data.targetType || 'boolean');
                    setEditTargetValue(res.data.targetValue || 1);
                    setEditUnit(res.data.unit || 'glasses');
                    setLoading(false);
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error("Error fetching habit:", err);
                    toast.error("Habit not found");
                    navigate('/');
                }
            });

        return () => {
            isMounted = false;
        };
    }, [id, navigate, toast]);

    const handleToggleToday = async (note = '') => {
        if (toggling) return;
        setToggling(true);

        const willBeCompleted = !habit.isCompletedToday;

        if (willBeCompleted) {
            try {
                confetti({
                    particleCount: 60,
                    spread: 70,
                    origin: { y: 0.7 },
                    colors: [habit.color || '#8b7cff', '#34d399', '#fbbf24']
                });
            } catch {
                // ignore confetti error
            }
        }

        try {
            const res = await api.patch(`/api/habits/${id}/toggle`, { note });
            setHabit(res.data);
            if (res.data.isCompletedToday) {
                toast.success(`Completed for today! 🔥 Streak: ${res.data.streak}`);
            } else {
                toast.info("Marked as undone");
            }
        } catch (err) {
            console.error("Toggle error:", err);
            toast.error("Failed to update status");
        } finally {
            setToggling(false);
        }
    };

    const handleApplyFreeze = async () => {
        if (freezing) return;
        setFreezing(true);
        try {
            const res = await api.post(`/api/habits/${id}/freeze`);
            setHabit(res.data);
            toast.success("Streak freeze applied! Your streak is saved ❄️🔥");
        } catch (err) {
            console.error("Freeze error:", err);
            toast.error(err.response?.data?.message || "Failed to apply streak freeze");
        } finally {
            setFreezing(false);
        }
    };

    const handleToggleArchive = async () => {
        try {
            const res = await api.patch(`/api/habits/${id}/archive`);
            setHabit(prev => ({ ...prev, isArchived: res.data.isArchived }));
            toast.success(res.data.isArchived ? "Habit moved to archives 📦" : "Habit restored to active dashboard 🎉");
        } catch (err) {
            console.error("Archive error:", err);
            toast.error("Failed to update archive status");
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        setSaving(true);
        try {
            const res = await api.put(`/api/habits/${id}`, {
                name: editName.trim(),
                description: editDesc.trim(),
                category: editCat,
                color: editColor,
                frequency: editFreq,
                targetType: editTargetType,
                targetValue: editTargetType === 'numeric' ? Math.max(1, Number(editTargetValue) || 1) : 1,
                unit: editTargetType === 'numeric' ? editUnit : ''
            });

            setHabit(res.data);
            toast.success("Habit updated successfully!");
            setIsEditOpen(false);
        } catch (err) {
            console.error("Update error:", err);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteHabit = async () => {
        setDeleting(true);
        try {
            await api.delete(`/api/habits/${id}`);
            toast.success("Habit deleted successfully");
            navigate('/');
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Failed to delete habit");
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="app-container">
                <div className="loading-state">
                    <div className="spinner" />
                    <p>Loading habit details…</p>
                </div>
            </div>
        );
    }

    if (!habit) return null;

    const accentColor = habit.color || '#8b7cff';
    const isNumeric = habit.targetType === 'numeric';

    return (
        <div className="app-container detail-page">
            {/* Top Navigation */}
            <div className="detail-nav">
                <button onClick={() => navigate('/')} className="btn-back">
                    ← Back to Habits
                </button>

                <div className="detail-top-actions">
                    <button
                        className="btn-archive"
                        onClick={handleToggleArchive}
                        title={habit.isArchived ? "Restore to active dashboard" : "Archive habit"}
                    >
                        {habit.isArchived ? '📥 Restore Habit' : '📦 Archive Habit'}
                    </button>
                    <button
                        className="btn-edit"
                        onClick={() => setIsEditOpen(true)}
                        title="Edit habit details"
                    >
                        ✎ Edit Habit
                    </button>
                    <button
                        className="btn-delete"
                        onClick={() => setIsDeleteOpen(true)}
                        title="Delete habit"
                    >
                        🗑 Delete
                    </button>
                </div>
            </div>

            {/* Archived Alert Banner if archived */}
            {habit.isArchived && (
                <div className="archive-notice-banner">
                    <span>📦 This habit is currently archived. It will not appear on the active daily dashboard.</span>
                    <button className="btn-restore-link" onClick={handleToggleArchive}>Restore to Active</button>
                </div>
            )}

            {/* Streak Freeze Alert Banner if eligible */}
            {habit.canFreezeYesterday && (habit.streakFreezesAvailable > 0) && (
                <div className="freeze-alert-banner">
                    <div className="freeze-alert-left">
                        <span className="freeze-icon">❄️</span>
                        <div>
                            <strong>Missed yesterday?</strong>
                            <p>You can use 1 of your {habit.streakFreezesAvailable} Streak Freezes to protect your streak!</p>
                        </div>
                    </div>
                    <button
                        className="btn-use-freeze"
                        onClick={handleApplyFreeze}
                        disabled={freezing}
                    >
                        {freezing ? 'Protecting…' : '❄️ Freeze Yesterday'}
                    </button>
                </div>
            )}

            {/* Header / Hero Card */}
            <header className="detail-header-card" style={{ borderColor: accentColor }}>
                <div className="detail-header-left">
                    <div className="detail-tags">
                        <span className="category-pill" style={{ borderColor: accentColor, color: accentColor }}>
                            {habit.category}
                        </span>
                        {habit.frequency && (
                            <span className="frequency-pill">{habit.frequency}</span>
                        )}
                        {isNumeric && (
                            <span className="numeric-badge-pill">
                                🎯 Target: {habit.targetValue} {habit.unit}
                            </span>
                        )}
                        {habit.strengthLevel && (
                            <span className="strength-pill">
                                {habit.strengthLevel}
                            </span>
                        )}
                    </div>
                    <h1 className="detail-title">{habit.name}</h1>
                    {habit.description && (
                        <p className="detail-desc">{habit.description}</p>
                    )}
                </div>

                <div className="detail-header-right">
                    <button
                        type="button"
                        className={`btn-hero-toggle ${habit.isCompletedToday ? 'done' : ''}`}
                        onClick={() => handleToggleToday('')}
                        disabled={toggling}
                        style={{ backgroundColor: habit.isCompletedToday ? '#10b981' : accentColor }}
                    >
                        {habit.isCompletedToday ? '✓ Completed Today' : 'Mark Done Today 🔥'}
                    </button>
                </div>
            </header>

            {/* Analytics Summary Stats Banner */}
            <section className="stats-banner">
                <div className="stats-card">
                    <span className="stats-label">Current Streak</span>
                    <span className="stats-value highlight-fire">
                        🔥 {habit.streak || 0} {habit.streak === 1 ? 'day' : 'days'}
                    </span>
                    <span className="stats-subtext">Active streak</span>
                </div>

                <div className="stats-card">
                    <span className="stats-label">Best Record</span>
                    <span className="stats-value highlight-trophy">
                        🏆 {habit.bestStreak || 0} {habit.bestStreak === 1 ? 'day' : 'days'}
                    </span>
                    <span className="stats-subtext">Personal record</span>
                </div>

                <div className="stats-card">
                    <span className="stats-label">Habit Strength</span>
                    <span className="stats-value highlight-accent">
                        💎 {habit.habitStrength || 0}%
                    </span>
                    <span className="stats-subtext">{habit.strengthLevel || 'Forming 🌱'}</span>
                </div>

                <div className="stats-card">
                    <span className="stats-label">30-Day Consistency</span>
                    <span className="stats-value highlight-green">
                        📈 {habit.completionRate30 || 0}%
                    </span>
                    <span className="stats-subtext">{habit.totalCompletions || 0} total check-ins</span>
                </div>
            </section>

            {/* Day of the Week Analytics Chart */}
            <section className="detail-section">
                <div className="card-surface">
                    <AnalyticsChart
                        dayOfWeekStats={habit.dayOfWeekStats || {}}
                        color={accentColor}
                        title="Day-of-Week Completion Pattern"
                    />
                </div>
            </section>

            {/* Contribution Grid Heatmap Section */}
            <section className="detail-section">
                <div className="section-header">
                    <h2>GitHub-Style Consistency Heatmap</h2>
                    <span className="section-sub">Hover or click any cell to inspect activity and attached reflection notes</span>
                </div>
                <div className="card-surface">
                    <ContributionGrid
                        entries={habit.entries || []}
                        color={accentColor}
                        isCompletedToday={habit.isCompletedToday}
                        onComplete={handleToggleToday}
                    />
                </div>
            </section>

            {/* Recent Completions Log */}
            <section className="detail-section">
                <div className="section-header">
                    <h2>Recent History & Notes</h2>
                    <span className="section-sub">Timeline of completed sessions</span>
                </div>

                {(!habit.entries || habit.entries.length === 0) ? (
                    <div className="empty-history-card">
                        <p>No check-in history yet. Mark today as completed to start your log!</p>
                    </div>
                ) : (
                    <div className="history-timeline">
                        {[...habit.entries]
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .slice(0, 10)
                            .map((entry, idx) => (
                                <div key={idx} className="timeline-item">
                                    <div
                                        className="timeline-dot"
                                        style={{ backgroundColor: entry.isFreeze ? '#38bdf8' : accentColor }}
                                    />
                                    <div className="timeline-content">
                                        <div className="timeline-date">
                                            {new Date(entry.date).toLocaleDateString(undefined, {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                            {entry.isFreeze && (
                                                <span className="freeze-tag-pill">❄️ Protected by Streak Freeze</span>
                                            )}
                                        </div>
                                        {entry.note ? (
                                            <p className="timeline-note">“{entry.note}”</p>
                                        ) : (
                                            <span className="timeline-note-empty">Check-in recorded</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </section>

            {/* Edit Habit Modal */}
            {isEditOpen && (
                <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
                    <div className="modal-card modal-card-wide" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Habit</h3>
                            <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="edit-name">Habit Name *</label>
                                <input
                                    id="edit-name"
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="edit-desc">Description</label>
                                <input
                                    id="edit-desc"
                                    type="text"
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Tracking Goal Type</label>
                                <div className="tracking-type-toggle">
                                    <button
                                        type="button"
                                        className={`tracking-type-btn ${editTargetType === 'boolean' ? 'active' : ''}`}
                                        onClick={() => setEditTargetType('boolean')}
                                    >
                                        ✓ Yes / No Check-off
                                    </button>
                                    <button
                                        type="button"
                                        className={`tracking-type-btn ${editTargetType === 'numeric' ? 'active' : ''}`}
                                        onClick={() => setEditTargetType('numeric')}
                                    >
                                        🔢 Numeric Target
                                    </button>
                                </div>
                            </div>

                            {editTargetType === 'numeric' && (
                                <div className="form-row numeric-inputs-row">
                                    <div className="form-group">
                                        <label htmlFor="edit-target-val">Daily Target Value</label>
                                        <input
                                            id="edit-target-val"
                                            type="number"
                                            min="1"
                                            value={editTargetValue}
                                            onChange={e => setEditTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="edit-unit">Unit of Measure</label>
                                        <input
                                            id="edit-unit"
                                            type="text"
                                            value={editUnit}
                                            onChange={e => setEditUnit(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {editTargetType === 'numeric' && (
                                <div className="unit-presets-row">
                                    <span className="unit-presets-label">Presets:</span>
                                    {UNIT_PRESETS.map(u => (
                                        <button
                                            type="button"
                                            key={u}
                                            className={`unit-preset-chip ${editUnit === u ? 'selected' : ''}`}
                                            onClick={() => setEditUnit(u)}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="edit-cat">Category</label>
                                    <select
                                        id="edit-cat"
                                        value={editCat}
                                        onChange={e => setEditCat(e.target.value)}
                                    >
                                        <option value="Career">Career</option>
                                        <option value="Health">Health</option>
                                        <option value="Fitness">Fitness</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Learning">Learning</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="edit-freq">Frequency</label>
                                    <select
                                        id="edit-freq"
                                        value={editFreq}
                                        onChange={e => setEditFreq(e.target.value)}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekdays">Weekdays (Mon-Fri)</option>
                                        <option value="weekends">Weekends Only</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Theme Color</label>
                                <div className="color-palette">
                                    {COLOR_PRESETS.map(c => (
                                        <button
                                            type="button"
                                            key={c}
                                            className={`color-swatch ${editColor === c ? 'selected' : ''}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setEditColor(c)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setIsEditOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <div className="modal-overlay" onClick={() => setIsDeleteOpen(false)}>
                    <div className="modal-card delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Delete Habit</h3>
                            <button className="modal-close-btn" onClick={() => setIsDeleteOpen(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to permanently delete <strong>{habit.name}</strong>?
                            </p>
                            <p className="text-danger-sm">
                                All streak history, {habit.totalCompletions || 0} completion logs, and notes will be permanently lost.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setIsDeleteOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-danger"
                                onClick={handleDeleteHabit}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting…' : 'Yes, Delete Habit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default HabitDetail;