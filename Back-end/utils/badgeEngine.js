/**
 * Badge and Achievement Computation Engine
 */

export const BADGE_DEFINITIONS = [
    {
        id: 'first_step',
        title: 'First Step',
        description: 'Complete your first habit check-in.',
        icon: '🌱',
        category: 'milestone',
        maxProgress: 1
    },
    {
        id: 'spark',
        title: 'Spark',
        description: 'Achieve a 3-day streak on any habit.',
        icon: '🔥',
        category: 'streak',
        maxProgress: 3
    },
    {
        id: 'momentum',
        title: 'Momentum',
        description: 'Build a solid 7-day streak on any habit.',
        icon: '⚡',
        category: 'streak',
        maxProgress: 7
    },
    {
        id: 'iron_will',
        title: 'Iron Will',
        description: 'Sustain an impressive 14-day streak.',
        icon: '🛡️',
        category: 'streak',
        maxProgress: 14
    },
    {
        id: 'habit_master',
        title: 'Habit Master',
        description: 'Reach a legendary 30-day streak.',
        icon: '👑',
        category: 'streak',
        maxProgress: 30
    },
    {
        id: 'century_club',
        title: 'Century Club',
        description: 'Achieve a monumental 100-day streak.',
        icon: '💯',
        category: 'streak',
        maxProgress: 100
    },
    {
        id: 'dedication',
        title: 'Dedication',
        description: 'Log 25 total check-ins across all your habits.',
        icon: '🎯',
        category: 'milestone',
        maxProgress: 25
    },
    {
        id: 'centurion',
        title: 'Centurion',
        description: 'Log 100 total check-ins across all your habits.',
        icon: '🏛️',
        category: 'milestone',
        maxProgress: 100
    },
    {
        id: 'renaissance',
        title: 'Renaissance',
        description: 'Build habits across 3 or more distinct categories.',
        icon: '🌐',
        category: 'variety',
        maxProgress: 3
    },
    {
        id: 'multitasker',
        title: 'Disciplined Life',
        description: 'Maintain 4 or more active habits simultaneously.',
        icon: '🌟',
        category: 'variety',
        maxProgress: 4
    }
];

export const computeUserBadges = (habits = []) => {
    let longestStreakEver = 0;
    let totalCompletionsCount = 0;
    const activeCategories = new Set();
    const activeHabitCount = habits.filter(h => !h.isArchived).length;

    habits.forEach(habit => {
        const streak = Math.max(habit.streak || 0, habit.bestStreak || 0);
        if (streak > longestStreakEver) longestStreakEver = streak;

        const entries = habit.entries || [];
        totalCompletionsCount += entries.length;

        if (entries.length > 0 && habit.category) {
            activeCategories.add(habit.category);
        }
    });

    return BADGE_DEFINITIONS.map(badge => {
        let currentProgress = 0;
        let unlocked = false;

        switch (badge.id) {
            case 'first_step':
                currentProgress = Math.min(1, totalCompletionsCount);
                unlocked = totalCompletionsCount >= 1;
                break;
            case 'spark':
                currentProgress = Math.min(3, longestStreakEver);
                unlocked = longestStreakEver >= 3;
                break;
            case 'momentum':
                currentProgress = Math.min(7, longestStreakEver);
                unlocked = longestStreakEver >= 7;
                break;
            case 'iron_will':
                currentProgress = Math.min(14, longestStreakEver);
                unlocked = longestStreakEver >= 14;
                break;
            case 'habit_master':
                currentProgress = Math.min(30, longestStreakEver);
                unlocked = longestStreakEver >= 30;
                break;
            case 'century_club':
                currentProgress = Math.min(100, longestStreakEver);
                unlocked = longestStreakEver >= 100;
                break;
            case 'dedication':
                currentProgress = Math.min(25, totalCompletionsCount);
                unlocked = totalCompletionsCount >= 25;
                break;
            case 'centurion':
                currentProgress = Math.min(100, totalCompletionsCount);
                unlocked = totalCompletionsCount >= 100;
                break;
            case 'renaissance':
                currentProgress = Math.min(3, activeCategories.size);
                unlocked = activeCategories.size >= 3;
                break;
            case 'multitasker':
                currentProgress = Math.min(4, activeHabitCount);
                unlocked = activeHabitCount >= 4;
                break;
            default:
                break;
        }

        return {
            ...badge,
            progress: currentProgress,
            unlocked
        };
    });
};
