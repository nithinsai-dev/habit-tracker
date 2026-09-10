import { useState, useEffect, useMemo, useCallback } from 'react';
import api from "../api/axios.js";
import Habit from '../components/Habit.jsx';
import Footer from "../components/Footer.jsx";
import BadgeModal from '../components/BadgeModal.jsx';
import useTheme from '../hooks/useTheme.js';
import useToast from "../hooks/useToast.js";

const CATEGORIES = ['All', 'Career', 'Health', 'Fitness', 'Finance', 'Learning', 'General'];
const COLOR_PRESETS = ['#8b7cff', '#22d3ee', '#fb923c', '#34d399', '#f472b6', '#f59e0b', '#ec4899'];
const UNIT_PRESETS = ['glasses', 'pages', 'mins', 'steps', 'km', 'times'];

function HabitTracker({ setToken }) {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useTheme();
    const toast = useToast();

    // Filters & Search & View mode
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [viewArchived, setViewArchived] = useState(false);

    // Gamification & Badges
    const [isBadgesOpen, setIsBadgesOpen] = useState(false);
    const [streakFreezes, setStreakFreezes] = useState(2);

    // Create Habit Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('General');
    const [color, setColor] = useState('#8b7cff');
    const [frequency, setFrequency] = useState('daily');
    const [targetType, setTargetType] = useState('boolean');
    const [targetValue, setTargetValue] = useState(1);
    const [unit, setUnit] = useState('glasses');
    const [creating, setCreating] = useState(false);

    // Toggling in progress map to prevent double-click spam
    const [togglingMap, setTogglingMap] = useState({});

    const userEmail = localStorage.getItem('userEmail') || 'User';

    const fetchHabits = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/habits?archived=${viewArchived}`);
            setHabits(res.data.habits || res.data || []);
            if (res.data.streakFreezesAvailable !== undefined) {
                setStreakFreezes(res.data.streakFreezesAvailable);
            }
        } catch (err) {
            console.error("Failed to fetch habits:", err);
            toast.error("Failed to load habits");
        } finally {
            setLoading(false);
        }
    }, [viewArchived, toast]);

    useEffect(() => {
        fetchHabits();
    }, [fetchHabits]);

    const handleAddHabit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Please enter a habit name");
            return;
        }

        setCreating(true);
        try {
            const res = await api.post('/api/habits', {
                name: name.trim(),
                description: description.trim(),
                category,
                color,
                frequency,
                targetType,
                targetValue: targetType === 'numeric' ? Math.max(1, Number(targetValue) || 1) : 1,
                unit: targetType === 'numeric' ? unit : ''
            });

            if (!viewArchived) {
                setHabits(prev => [res.data, ...prev]);
            }
            toast.success("Habit created successfully! 🎯");
            setName('');
            setDescription('');
            setCategory('General');
            setColor('#8b7cff');
            setFrequency('daily');
            setTargetType('boolean');
            setTargetValue(1);
            setUnit('glasses');
            setIsAddModalOpen(false);
        } catch (err) {
            console.error("Failed to add habit", err);
            toast.error(err.response?.data?.message || "Failed to create habit");
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (habitId) => {
        if (togglingMap[habitId]) return;

        const originalHabits = [...habits];
        const targetHabit = habits.find(h => h._id === habitId);
        if (!targetHabit) return;

        const nextCompletedState = !targetHabit.isCompletedToday;

        // Optimistic UI update
        setHabits(prev => prev.map(h => {
            if (h._id === habitId) {
                const newStreak = nextCompletedState ? (h.streak || 0) + 1 : Math.max(0, (h.streak || 1) - 1);
                return {
                    ...h,
                    isCompletedToday: nextCompletedState,
                    completed: nextCompletedState,
                    todayValue: nextCompletedState ? (h.targetValue || 1) : 0,
                    streak: newStreak,
                    bestStreak: Math.max(h.bestStreak || 0, newStreak)
                };
            }
            return h;
        }));

        setTogglingMap(prev => ({ ...prev, [habitId]: true }));

        try {
            const res = await api.patch(`/api/habits/${habitId}/toggle`);
            setHabits(prev => prev.map(h => h._id === habitId ? res.data : h));
            if (res.data.isCompletedToday) {
                toast.success(`Completed "${res.data.name}"! 🔥 Streak: ${res.data.streak}`);
            } else {
                toast.info(`Marked "${res.data.name}" as undone`);
            }
        } catch {
            setHabits(originalHabits);
            toast.error("Failed to update habit status");
        } finally {
            setTogglingMap(prev => ({ ...prev, [habitId]: false }));
        }
    };

    const handleProgress = async (habitId, delta) => {
        const originalHabits = [...habits];
        const targetHabit = habits.find(h => h._id === habitId);
        if (!targetHabit) return;

        const currentVal = targetHabit.todayValue || 0;
        const targetVal = targetHabit.targetValue || 1;
        const nextVal = Math.max(0, currentVal + delta);
        const isComplete = nextVal >= targetVal;

        // Optimistic update
        setHabits(prev => prev.map(h => {
            if (h._id === habitId) {
                return {
                    ...h,
                    todayValue: nextVal,
                    isCompletedToday: isComplete,
                    completed: isComplete
                };
            }
            return h;
        }));

        try {
            const res = await api.patch(`/api/habits/${habitId}/progress`, { delta });
            setHabits(prev => prev.map(h => h._id === habitId ? res.data : h));
            if (res.data.isCompletedToday && !targetHabit.isCompletedToday) {
                toast.success(`Target reached for "${res.data.name}"! 🎉 🔥 Streak: ${res.data.streak}`);
            }
        } catch {
            setHabits(originalHabits);
            toast.error("Failed to update progress");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        if (setToken) setToken(null);
        toast.info("Logged out successfully");
    };

    // Filtered habits
    const filteredHabits = useMemo(() => {
        return habits.filter(h => {
            const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
                (h.description && h.description.toLowerCase().includes(search.toLowerCase()));
            const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [habits, search, selectedCategory]);

    // Dashboard metrics
    const metrics = useMemo(() => {
        const total = habits.length;
        const completedToday = habits.filter(h => h.isCompletedToday).length;
        const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
        const bestAllTime = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);
        const percentDone = total > 0 ? Math.round((completedToday / total) * 100) : 0;

        return { total, completedToday, longestStreak, bestAllTime, percentDone };
    }, [habits]);

    return (
        <div className="app-container">
            {/* Top Navigation Bar */}
            <header className="app-header">
                <div className="brand-logo">
                    <span className="logo-icon">🔥</span>
                    <span className="logo-title">HabitFlow</span>
                </div>

                <div className="header-actions">
                    <button
                        className="btn-badges-trophy"
                        onClick={() => setIsBadgesOpen(true)}
                        title="View achievements and milestone badges"
                    >
                        🏆 Achievements
                    </button>

                    <div className="user-profile-badge" title={userEmail}>
                        <span className="avatar-letter">{userEmail.charAt(0).toUpperCase()}</span>
                        <span className="user-email-text">{userEmail}</span>
                    </div>

                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="theme-toggle-btn"
                        aria-label="Toggle theme"
                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
                    >
                        {theme === 'dark' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                            </svg>
                        )}
                    </button>

                    <button onClick={handleLogout} className="btn-logout" title="Sign out of your account">
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Daily Overview Stats Banner */}
            <section className="stats-banner">
                <div className="stats-card">
                    <span className="stats-label">Daily Progress</span>
                    <div className="progress-headline">
                        <span className="stats-value">{metrics.completedToday} / {metrics.total}</span>
                        <span className="progress-percentage">{metrics.percentDone}%</span>
                    </div>
                    <div className="progress-bar-track">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${metrics.percentDone}%` }}
                        />
                    </div>
                </div>

                <div className="stats-card">
                    <span className="stats-label">Current Streak</span>
                    <span className="stats-value highlight-fire">
                        🔥 {metrics.longestStreak} {metrics.longestStreak === 1 ? 'day' : 'days'}
                    </span>
                    <span className="stats-subtext">Highest active consistency</span>
                </div>

                <div className="stats-card">
                    <span className="stats-label">Streak Freezes</span>
                    <span className="stats-value highlight-freeze">
                        ❄️ {streakFreezes} {streakFreezes === 1 ? 'Freeze' : 'Freezes'}
                    </span>
                    <span className="stats-subtext">Protects missed days</span>
                </div>

                <div className="stats-card cta-card">
                    <button
                        className="btn-create-habit"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <span className="plus-icon">+</span> New Habit
                    </button>
                </div>
            </section>

            {/* Active vs Archived View Switcher & Search Toolbar */}
            <div className="toolbar-section">
                <div className="status-tabs-wrap">
                    <div className="status-tabs">
                        <button
                            type="button"
                            className={`status-tab ${!viewArchived ? 'active' : ''}`}
                            onClick={() => setViewArchived(false)}
                        >
                            Active Habits
                        </button>
                        <button
                            type="button"
                            className={`status-tab ${viewArchived ? 'active' : ''}`}
                            onClick={() => setViewArchived(true)}
                        >
                            📦 Archived
                        </button>
                    </div>

                    <div className="search-box">
                        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search habits by name or description…"
                            className="search-input-field"
                        />
                        {search && (
                            <button className="search-clear-btn" onClick={() => setSearch('')}>✕</button>
                        )}
                    </div>
                </div>

                <div className="category-filter-pills">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Habits Grid */}
            <main className="main-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <p>Loading your habits…</p>
                    </div>
                ) : filteredHabits.length === 0 ? (
                    <div className="empty-state-card">
                        <div className="empty-state-icon">{viewArchived ? '📦' : '🌱'}</div>
                        <h3>
                            {viewArchived
                                ? 'No archived habits'
                                : (search || selectedCategory !== 'All' ? 'No habits match your filters' : 'No habits yet')}
                        </h3>
                        <p>
                            {viewArchived
                                ? 'Completed or paused habits that you archive will appear here safely.'
                                : (search || selectedCategory !== 'All'
                                    ? 'Try changing your search terms or category filter.'
                                    : 'Start tracking your daily goals, build unstoppable streaks, and visualize your progress!')}
                        </p>
                        {!viewArchived && (
                            <button
                                className="btn-primary"
                                onClick={() => setIsAddModalOpen(true)}
                            >
                                + Create First Habit
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="habits-grid">
                        {filteredHabits.map(habit => (
                            <Habit
                                key={habit._id}
                                habit={habit}
                                onToggle={handleToggle}
                                onProgress={handleProgress}
                                isToggling={!!togglingMap[habit._id]}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Create Habit Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div className="modal-card modal-card-wide" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Habit</h3>
                            <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>✕</button>
                        </div>

                        <form onSubmit={handleAddHabit} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="habit-name">Habit Name *</label>
                                <input
                                    id="habit-name"
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Drink 8 glasses of water, Morning Run, Read book"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="habit-desc">Description (Optional)</label>
                                <input
                                    id="habit-desc"
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="e.g. Keep hydrated throughout work hours"
                                />
                            </div>

                            {/* Habit Type Selector (Standard vs Numeric) */}
                            <div className="form-group">
                                <label>Tracking Goal Type</label>
                                <div className="tracking-type-toggle">
                                    <button
                                        type="button"
                                        className={`tracking-type-btn ${targetType === 'boolean' ? 'active' : ''}`}
                                        onClick={() => setTargetType('boolean')}
                                    >
                                        ✓ Yes / No Check-off
                                    </button>
                                    <button
                                        type="button"
                                        className={`tracking-type-btn ${targetType === 'numeric' ? 'active' : ''}`}
                                        onClick={() => setTargetType('numeric')}
                                    >
                                        🔢 Numeric Target (e.g. 8 glasses)
                                    </button>
                                </div>
                            </div>

                            {targetType === 'numeric' && (
                                <div className="form-row numeric-inputs-row">
                                    <div className="form-group">
                                        <label htmlFor="habit-target-val">Daily Target Value</label>
                                        <input
                                            id="habit-target-val"
                                            type="number"
                                            min="1"
                                            max="100000"
                                            value={targetValue}
                                            onChange={e => setTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="habit-unit">Unit of Measure</label>
                                        <div className="unit-selector-wrap">
                                            <input
                                                id="habit-unit"
                                                type="text"
                                                value={unit}
                                                onChange={e => setUnit(e.target.value)}
                                                placeholder="e.g. glasses, pages"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {targetType === 'numeric' && (
                                <div className="unit-presets-row">
                                    <span className="unit-presets-label">Presets:</span>
                                    {UNIT_PRESETS.map(u => (
                                        <button
                                            type="button"
                                            key={u}
                                            className={`unit-preset-chip ${unit === u ? 'selected' : ''}`}
                                            onClick={() => setUnit(u)}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="habit-cat">Category</label>
                                    <select
                                        id="habit-cat"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
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
                                    <label htmlFor="habit-freq">Frequency</label>
                                    <select
                                        id="habit-freq"
                                        value={frequency}
                                        onChange={e => setFrequency(e.target.value)}
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
                                            className={`color-swatch ${color === c ? 'selected' : ''}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setColor(c)}
                                            aria-label={`Select color ${c}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={creating}
                                >
                                    {creating ? 'Creating…' : 'Create Habit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Achievements & Trophies Modal */}
            <BadgeModal
                isOpen={isBadgesOpen}
                onClose={() => setIsBadgesOpen(false)}
            />

            <Footer />
        </div>
    );
}

export default HabitTracker;