import express from "express";
import Habit from "../models/habit.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { computeUserBadges } from "../utils/badgeEngine.js";

const router = express.Router();

router.use(authMiddleware);

// Helper to get YYYY-MM-DD from Date or string
const toDateStr = (dateInput) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get previous date string (1 day before)
const getPrevDateStr = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    return toDateStr(date);
};

// Helper to determine if a date is a scheduled day for a given habit frequency
const isScheduledDay = (dateInput, frequency = 'daily') => {
    if (!frequency || frequency === 'daily') return true;
    let d;
    if (typeof dateInput === 'string') {
        const [y, m, day] = dateInput.split('-').map(Number);
        d = new Date(y, m - 1, day);
    } else {
        d = new Date(dateInput);
    }
    const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (frequency === 'weekdays') {
        return dayOfWeek >= 1 && dayOfWeek <= 5;
    }
    if (frequency === 'weekends') {
        return dayOfWeek === 0 || dayOfWeek === 6;
    }
    return true;
};

// Helper to step backward to the previous scheduled date according to habit frequency
const getPrevScheduledDateStr = (dateStr, frequency = 'daily') => {
    let cursor = getPrevDateStr(dateStr);
    if (!frequency || frequency === 'daily') return cursor;
    let safety = 0;
    while (!isScheduledDay(cursor, frequency) && safety < 14) {
        cursor = getPrevDateStr(cursor);
        safety++;
    }
    return cursor;
};

// Helper to get the most recent scheduled date on or before dateStr
const getLastScheduledDateOnOrBefore = (dateStr, frequency = 'daily') => {
    let cursor = dateStr;
    if (!frequency || frequency === 'daily') return cursor;
    let safety = 0;
    while (!isScheduledDay(cursor, frequency) && safety < 14) {
        cursor = getPrevDateStr(cursor);
        safety++;
    }
    return cursor;
};

// Helper to check and reset monthly streak freezes
const getAndResetUserFreezes = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return 0;

    const now = new Date();
    const lastReset = user.lastFreezeResetDate ? new Date(user.lastFreezeResetDate) : new Date(0);

    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        user.streakFreezesAvailable = 2;
        user.lastFreezeResetDate = now;
        await user.save();
    }

    return user.streakFreezesAvailable;
};

// Calculate streak, bestStreak, habit strength, and completion info
const computeHabitStats = (habit, referenceDate = new Date()) => {
    const todayStr = toDateStr(referenceDate);
    const frequency = habit.frequency || 'daily';

    const isTodayScheduled = isScheduledDay(todayStr, frequency);
    const prevScheduledStr = getPrevScheduledDateStr(todayStr, frequency);
    const lastScheduledOnOrBeforeTodayStr = getLastScheduledDateOnOrBefore(todayStr, frequency);

    const rawEntries = habit.entries || [];
    const dateSet = new Set();
    const entryMap = new Map();

    const isNumeric = habit.targetType === 'numeric';
    const targetVal = isNumeric ? (habit.targetValue || 1) : 1;

    rawEntries.forEach(entry => {
        const ds = entry.dateStr || toDateStr(entry.date);
        if (ds) {
            entryMap.set(ds, entry);
            // Completed if boolean or if numeric value reaches target or if it is a streak freeze
            if (entry.isFreeze || !isNumeric || (entry.value || 0) >= targetVal) {
                dateSet.add(ds);
            }
        }
    });

    const todayEntry = entryMap.get(todayStr);
    const todayValue = todayEntry ? (todayEntry.value || 0) : 0;
    const isCompletedToday = dateSet.has(todayStr);

    // Compute active current streak
    let currentStreak = 0;
    let checkDateStr = null;

    if (isCompletedToday) {
        // Completed today (scheduled or bonus day)
        checkDateStr = todayStr;
    } else if (isTodayScheduled) {
        // Today is a scheduled day, not yet completed: grace period applies if previous scheduled day was completed
        if (dateSet.has(prevScheduledStr)) {
            checkDateStr = prevScheduledStr;
        }
    } else {
        // Today is an off/rest day: streak stays alive if the last scheduled day was completed
        if (dateSet.has(lastScheduledOnOrBeforeTodayStr)) {
            checkDateStr = lastScheduledOnOrBeforeTodayStr;
        }
    }

    if (checkDateStr) {
        currentStreak = 0;
        let cursor = checkDateStr;
        while (dateSet.has(cursor)) {
            currentStreak++;
            cursor = getPrevScheduledDateStr(cursor, frequency);
        }
    }

    // Compute all-time best streak
    const sortedDates = Array.from(dateSet).sort();
    let maxStreak = 0;
    let runningStreak = 0;
    let prevDate = null;

    for (const dStr of sortedDates) {
        if (!prevDate) {
            runningStreak = 1;
        } else {
            // Consecutive if no scheduled day was skipped between prevDate and dStr
            const expectedPrev = getPrevScheduledDateStr(dStr, frequency);
            if (prevDate >= expectedPrev) {
                runningStreak++;
            } else {
                runningStreak = 1;
            }
        }
        if (runningStreak > maxStreak) {
            maxStreak = runningStreak;
        }
        prevDate = dStr;
    }

    const bestStreak = Math.max(habit.bestStreak || 0, maxStreak, currentStreak);

    // Last 7 days history array
    const last7Days = [];
    let dayCursor = new Date(referenceDate);
    for (let i = 6; i >= 0; i--) {
        const d = new Date(dayCursor);
        d.setDate(dayCursor.getDate() - i);
        const ds = toDateStr(d);
        last7Days.push({
            dateStr: ds,
            completed: dateSet.has(ds),
            isFreeze: entryMap.get(ds)?.isFreeze || false,
            isScheduled: isScheduledDay(ds, frequency)
        });
    }

    // 30 days completion rate (fair denominator based on scheduled days)
    let scheduledIn30Days = 0;
    let completedIn30Days = 0;
    for (let i = 0; i < 30; i++) {
        const d = new Date(dayCursor);
        d.setDate(dayCursor.getDate() - i);
        const ds = toDateStr(d);
        if (isScheduledDay(ds, frequency)) {
            scheduledIn30Days++;
        }
        if (dateSet.has(ds)) {
            completedIn30Days++;
        }
    }
    const denominator30 = scheduledIn30Days > 0 ? scheduledIn30Days : 30;
    const completionRate30 = Math.min(100, Math.round((completedIn30Days / denominator30) * 100));

    // 60 days Habit Strength / Consistency Score with Recency Weighting
    let earnedStrengthPoints = 0;
    let maxStrengthPoints = 0;
    for (let i = 0; i < 60; i++) {
        const d = new Date(dayCursor);
        d.setDate(dayCursor.getDate() - i);
        const ds = toDateStr(d);
        const weight = i < 14 ? 2 : 1; // More recent days carry higher weight
        if (isScheduledDay(ds, frequency)) {
            maxStrengthPoints += weight;
        }
        if (dateSet.has(ds)) {
            earnedStrengthPoints += weight;
        }
    }
    if (maxStrengthPoints === 0) maxStrengthPoints = 74;
    const habitStrength = Math.min(100, Math.round((earnedStrengthPoints / maxStrengthPoints) * 100));

    let strengthLevel = 'Forming 🌱';
    if (habitStrength >= 75) strengthLevel = 'Unbreakable 💎';
    else if (habitStrength >= 50) strengthLevel = 'Strong 🌳';
    else if (habitStrength >= 25) strengthLevel = 'Developing 🌿';

    // Check if the previous scheduled day can be frozen
    const lastScheduledDayToFreeze = isTodayScheduled ? prevScheduledStr : lastScheduledOnOrBeforeTodayStr;
    const dayBeforeThatScheduled = getPrevScheduledDateStr(lastScheduledDayToFreeze, frequency);
    const canFreezeYesterday = !dateSet.has(lastScheduledDayToFreeze) && dateSet.has(dayBeforeThatScheduled);

    return {
        isCompletedToday,
        todayValue,
        currentStreak,
        bestStreak,
        totalCompletions: dateSet.size,
        last7Days,
        completionRate30,
        habitStrength,
        strengthLevel,
        canFreezeYesterday
    };
};

// GET all habits for the logged-in user (Supports ?archived=true/false)
router.get("/", async (req, res) => {
    try {
        const isArchivedQuery = req.query.archived === 'true';
        const habits = await Habit.find({
            userId: req.userId,
            isArchived: isArchivedQuery
        }).sort({ createdAt: -1 });

        const streakFreezes = await getAndResetUserFreezes(req.userId);

        const enriched = habits.map(habit => {
            const stats = computeHabitStats(habit);
            return {
                ...habit.toObject(),
                completed: stats.isCompletedToday,
                isCompletedToday: stats.isCompletedToday,
                todayValue: stats.todayValue,
                streak: stats.currentStreak,
                bestStreak: stats.bestStreak,
                totalCompletions: stats.totalCompletions,
                last7Days: stats.last7Days,
                habitStrength: stats.habitStrength,
                strengthLevel: stats.strengthLevel,
                canFreezeYesterday: stats.canFreezeYesterday
            };
        });

        res.json({
            habits: enriched,
            streakFreezesAvailable: streakFreezes
        });
    } catch (err) {
        console.error("GET /habits error:", err.message);
        res.status(500).json({ message: "Failed to fetch habits" });
    }
});

// GET badges and milestone achievements
router.get("/badges", async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.userId });
        const badges = computeUserBadges(habits);
        res.json(badges);
    } catch (err) {
        console.error("GET /habits/badges error:", err.message);
        res.status(500).json({ message: "Failed to fetch badges" });
    }
});

// GET analytics breakdown (Day of week & monthly trends)
router.get("/analytics", async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.userId });

        // Day of week frequency: 0 (Sun) to 6 (Sat)
        // We order: Mon, Tue, Wed, Thu, Fri, Sat, Sun
        const dayCounts = {
            'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
        };
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Category frequency
        const categoryCounts = {};

        // Monthly frequency (last 6 months)
        const monthlyCounts = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mKey = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthlyCounts[mKey] = 0;
        }

        habits.forEach(habit => {
            (habit.entries || []).forEach(entry => {
                const d = new Date(entry.date);
                if (!isNaN(d.getTime())) {
                    const dayName = dayNames[d.getDay()];
                    if (dayCounts[dayName] !== undefined) {
                        dayCounts[dayName]++;
                    }

                    const mKey = d.toLocaleString('default', { month: 'short', year: '2-digit' });
                    if (monthlyCounts[mKey] !== undefined) {
                        monthlyCounts[mKey]++;
                    }

                    const cat = habit.category || 'General';
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                }
            });
        });

        res.json({
            dayOfWeek: dayCounts,
            monthly: monthlyCounts,
            categories: categoryCounts
        });
    } catch (err) {
        console.error("GET /habits/analytics error:", err.message);
        res.status(500).json({ message: "Failed to fetch analytics" });
    }
});

// GET single habit detail with full analytics
router.get("/:id", async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
        if (!habit) {
            return res.status(404).json({ message: "Habit not found" });
        }

        const streakFreezes = await getAndResetUserFreezes(req.userId);
        const stats = computeHabitStats(habit);

        // Compute habit-specific day-of-week completions
        const dayCounts = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        (habit.entries || []).forEach(entry => {
            const d = new Date(entry.date);
            if (!isNaN(d.getTime())) {
                const dayName = dayNames[d.getDay()];
                if (dayCounts[dayName] !== undefined) {
                    dayCounts[dayName]++;
                }
            }
        });

        res.json({
            ...habit.toObject(),
            completed: stats.isCompletedToday,
            isCompletedToday: stats.isCompletedToday,
            todayValue: stats.todayValue,
            streak: stats.currentStreak,
            bestStreak: stats.bestStreak,
            totalCompletions: stats.totalCompletions,
            completionRate30: stats.completionRate30,
            habitStrength: stats.habitStrength,
            strengthLevel: stats.strengthLevel,
            canFreezeYesterday: stats.canFreezeYesterday,
            last7Days: stats.last7Days,
            dayOfWeekStats: dayCounts,
            streakFreezesAvailable: streakFreezes
        });
    } catch (err) {
        console.error("GET /habits/:id error:", err.message);
        res.status(500).json({ message: "Failed to fetch habit detail" });
    }
});

// CREATE a new habit
router.post("/", async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            color,
            frequency,
            targetType,
            targetValue,
            unit
        } = req.body || {};

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Habit name is required" });
        }

        const habit = new Habit({
            name: name.trim(),
            description: (description || "").trim(),
            category: category || "General",
            color: color || "#8b7cff",
            frequency: frequency || "daily",
            targetType: targetType === 'numeric' ? 'numeric' : 'boolean',
            targetValue: targetType === 'numeric' ? Math.max(1, Number(targetValue) || 1) : 1,
            unit: (unit || (targetType === 'numeric' ? 'times' : '')).trim(),
            userId: req.userId
        });

        await habit.save();
        const stats = computeHabitStats(habit);

        res.status(201).json({
            ...habit.toObject(),
            completed: false,
            isCompletedToday: false,
            todayValue: 0,
            streak: 0,
            bestStreak: 0,
            totalCompletions: 0,
            habitStrength: 0,
            strengthLevel: 'Forming 🌱',
            last7Days: stats.last7Days
        });
    } catch (err) {
        console.error("POST /habits error:", err.message);
        res.status(500).json({ message: "Failed to create habit" });
    }
});

// UPDATE habit details
router.put("/:id", async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            color,
            frequency,
            targetType,
            targetValue,
            unit
        } = req.body || {};

        if (name !== undefined && !name.trim()) {
            return res.status(400).json({ message: "Habit name cannot be empty" });
        }

        const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
        if (!habit) {
            return res.status(404).json({ message: "Habit not found" });
        }

        if (name !== undefined) habit.name = name.trim();
        if (description !== undefined) habit.description = description.trim();
        if (category !== undefined) habit.category = category;
        if (color !== undefined) habit.color = color;
        if (frequency !== undefined) habit.frequency = frequency;
        if (targetType !== undefined) habit.targetType = targetType;
        if (targetValue !== undefined) habit.targetValue = Math.max(1, Number(targetValue) || 1);
        if (unit !== undefined) habit.unit = unit.trim();

        await habit.save();
        const stats = computeHabitStats(habit);

        res.json({
            ...habit.toObject(),
            completed: stats.isCompletedToday,
            isCompletedToday: stats.isCompletedToday,
            todayValue: stats.todayValue,
            streak: stats.currentStreak,
            bestStreak: stats.bestStreak,
            totalCompletions: stats.totalCompletions,
            habitStrength: stats.habitStrength,
            strengthLevel: stats.strengthLevel,
            last7Days: stats.last7Days
        });
    } catch (err) {
        console.error("PUT /habits/:id error:", err.message);
        res.status(500).json({ message: "Failed to update habit" });
    }
});

// TOGGLE completion for today (1-click toggle with undo support)
router.patch("/:id/toggle", async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
        if (!habit) {
            return res.status(404).json({ message: "Habit not found" });
        }

        const clientDate = req.body?.date ? new Date(req.body.date) : new Date();
        const todayStr = toDateStr(clientDate);
        const note = req.body?.note || "";

        const existingIndex = habit.entries.findIndex(e => {
            const ds = e.dateStr || toDateStr(e.date);
            return ds === todayStr;
        });

        let toggledState = false;
        const targetVal = habit.targetType === 'numeric' ? (habit.targetValue || 1) : 1;

        if (existingIndex > -1) {
            // UNCOMPLETE: remove entry for today
            habit.entries.splice(existingIndex, 1);
            toggledState = false;
        } else {
            // COMPLETE: add entry for today
            habit.entries.push({
                date: clientDate,
                dateStr: todayStr,
                note: note,
                value: targetVal
            });
            habit.lastCompletedDate = clientDate;
            toggledState = true;
        }

        const stats = computeHabitStats(habit, clientDate);
        habit.streak = stats.currentStreak;
        habit.bestStreak = stats.bestStreak;
        habit.completed = toggledState;

        await habit.save();

        res.json({
            ...habit.toObject(),
            completed: toggledState,
            isCompletedToday: toggledState,
            todayValue: toggledState ? targetVal : 0,
            streak: stats.currentStreak,
            bestStreak: stats.bestStreak,
            totalCompletions: stats.totalCompletions,
            completionRate30: stats.completionRate30,
            habitStrength: stats.habitStrength,
            strengthLevel: stats.strengthLevel,
            last7Days: stats.last7Days
        });
    } catch (err) {
        console.error("PATCH /habits/:id/toggle error:", err.message);
        res.status(500).json({ message: "Failed to toggle habit" });
    }
});

// NUMERIC STEPPER PROGRESS (Increment / Decrement / Set Value)
router.patch("/:id/progress", async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
        if (!habit) {
            return res.status(404).json({ message: "Habit not found" });
        }

        const clientDate = req.body?.date ? new Date(req.body.date) : new Date();
        const todayStr = toDateStr(clientDate);
        const delta = Number(req.body?.delta) || 0;
        const targetVal = habit.targetValue || 1;

        let existingEntry = habit.entries.find(e => (e.dateStr || toDateStr(e.date)) === todayStr);

        if (!existingEntry) {
            existingEntry = {
                date: clientDate,
                dateStr: todayStr,
                note: '',
                value: 0
            };
            habit.entries.push(existingEntry);
        }

        let newValue = Math.max(0, (existingEntry.value || 0) + delta);
        if (req.body?.value !== undefined) {
            newValue = Math.max(0, Number(req.body.value) || 0);
        }

        existingEntry.value = newValue;

        // If value dropped to 0, remove entry to keep logs clean
        if (newValue === 0) {
            habit.entries = habit.entries.filter(e => (e.dateStr || toDateStr(e.date)) !== todayStr);
        } else if (newValue >= targetVal) {
            habit.lastCompletedDate = clientDate;
        }

        const stats = computeHabitStats(habit, clientDate);
        habit.streak = stats.currentStreak;
        habit.bestStreak = stats.bestStreak;
        habit.completed = stats.isCompletedToday;

        await habit.save();

        res.json({
            ...habit.toObject(),
            completed: stats.isCompletedToday,
            isCompletedToday: stats.isCompletedToday,
            todayValue: newValue,
            streak: stats.currentStreak,
            bestStreak: stats.bestStreak,
            totalCompletions: stats.totalCompletions,
            completionRate30: stats.completionRate30,
            habitStrength: stats.habitStrength,
            strengthLevel: stats.strengthLevel,
            last7Days: stats.last7Days
        });
    } catch (err) {
        console.error("PATCH /habits/:id/progress error:", err.message);
        res.status(500).json({ message: "Failed to update habit progress" });
    }
});

// APPLY STREAK FREEZE FOR YESTERDAY
router.post("/:id/freeze", async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const available = await getAndResetUserFreezes(req.userId);
        if (available <= 0) {
            return res.status(400).json({ message: "No streak freezes remaining for this month" });
        }

        const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
        if (!habit) return res.status(404).json({ message: "Habit not found" });

        const today = new Date();
        const todayStr = toDateStr(today);
        const frequency = habit.frequency || 'daily';
        const isTodayScheduled = isScheduledDay(todayStr, frequency);
        const targetFreezeDateStr = isTodayScheduled
            ? getPrevScheduledDateStr(todayStr, frequency)
            : getLastScheduledDateOnOrBefore(todayStr, frequency);

        const existingTarget = habit.entries.some(e => (e.dateStr || toDateStr(e.date)) === targetFreezeDateStr);
        if (existingTarget) {
            return res.status(400).json({ message: "Previous scheduled day is already logged" });
        }

        // Add freeze entry for target scheduled day
        const [y, m, d] = targetFreezeDateStr.split('-').map(Number);
        const freezeDate = new Date(y, m - 1, d);

        habit.entries.push({
            date: freezeDate,
            dateStr: targetFreezeDateStr,
            note: 'Streak Protected ❄️',
            isFreeze: true,
            value: habit.targetValue || 1
        });

        // Deduct 1 freeze from user
        user.streakFreezesAvailable = Math.max(0, user.streakFreezesAvailable - 1);
        await user.save();

        const stats = computeHabitStats(habit, today);
        habit.streak = stats.currentStreak;
        habit.bestStreak = stats.bestStreak;

        await habit.save();

        res.json({
            ...habit.toObject(),
            streakFreezesAvailable: user.streakFreezesAvailable,
            completed: stats.isCompletedToday,
            isCompletedToday: stats.isCompletedToday,
            todayValue: stats.todayValue,
            streak: stats.currentStreak,
            bestStreak: stats.bestStreak,
            totalCompletions: stats.totalCompletions,
            habitStrength: stats.habitStrength,
            strengthLevel: stats.strengthLevel,
            canFreezeYesterday: false,
            last7Days: stats.last7Days
        });
    } catch (err) {
        console.error("POST /habits/:id/freeze error:", err.message);
        res.status(500).json({ message: "Failed to apply streak freeze" });
    }
});

// ARCHIVE OR RESTORE A HABIT
router.patch("/:id/archive", async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
        if (!habit) {
            return res.status(404).json({ message: "Habit not found" });
        }

        habit.isArchived = !habit.isArchived;
        await habit.save();

        res.json({
            message: habit.isArchived ? "Habit archived successfully" : "Habit restored successfully",
            isArchived: habit.isArchived,
            id: habit._id
        });
    } catch (err) {
        console.error("PATCH /habits/:id/archive error:", err.message);
        res.status(500).json({ message: "Failed to update archive status" });
    }
});

// DELETE a habit
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!deleted) {
            return res.status(404).json({ message: "Habit not found" });
        }
        res.json({ message: "Habit deleted successfully", id: req.params.id });
    } catch (err) {
        console.error("DELETE /habits/:id error:", err.message);
        res.status(500).json({ message: "Server error deleting habit" });
    }
});

export { computeHabitStats, isScheduledDay, getPrevScheduledDateStr, getLastScheduledDateOnOrBefore };
export default router;
