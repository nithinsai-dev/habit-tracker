import {
    computeHabitStats,
    isScheduledDay,
    getPrevScheduledDateStr,
    getLastScheduledDateOnOrBefore
} from "./routes/habit.js";

// Helper to format date safely
const toDateStr = (dateInput) => {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function assert(condition, message) {
    if (!condition) {
        console.error("❌ FAIL:", message);
        process.exit(1);
    } else {
        console.log("✅ PASS:", message);
    }
}

console.log("==================================================");
console.log("🧪 TESTING FREQUENCY-AWARE STREAKS & ANALYTICS");
console.log("==================================================\n");

console.log("--- TEST 1: Schedule Helpers (Weekdays & Weekends) ---");
assert(isScheduledDay("2026-09-11", "weekdays") === true, "2026-09-11 (Friday) is a weekday");
assert(isScheduledDay("2026-09-12", "weekdays") === false, "2026-09-12 (Saturday) is NOT a weekday");
assert(isScheduledDay("2026-09-13", "weekdays") === false, "2026-09-13 (Sunday) is NOT a weekday");
assert(isScheduledDay("2026-09-14", "weekdays") === true, "2026-09-14 (Monday) is a weekday");

assert(getPrevScheduledDateStr("2026-09-14", "weekdays") === "2026-09-11", "Monday steps back to Friday for weekdays");
assert(getPrevScheduledDateStr("2026-09-15", "weekdays") === "2026-09-14", "Tuesday steps back to Monday");
assert(getLastScheduledDateOnOrBefore("2026-09-13", "weekdays") === "2026-09-11", "On Sunday, last scheduled day was Friday");

assert(isScheduledDay("2026-09-12", "weekends") === true, "Saturday is weekend");
assert(isScheduledDay("2026-09-13", "weekends") === true, "Sunday is weekend");
assert(isScheduledDay("2026-09-14", "weekends") === false, "Monday is NOT weekend");
assert(getPrevScheduledDateStr("2026-09-19", "weekends") === "2026-09-13", "Next Saturday steps back to last Sunday for weekends");

console.log("\n--- TEST 2: Weekdays Habit (Friday -> Weekend Rest -> Monday) ---");
const weekdayEntries = [
    { dateStr: "2026-09-07", value: 1 }, // Mon
    { dateStr: "2026-09-08", value: 1 }, // Tue
    { dateStr: "2026-09-09", value: 1 }, // Wed
    { dateStr: "2026-09-10", value: 1 }, // Thu
    { dateStr: "2026-09-11", value: 1 }  // Fri
];

const habitWeekdays = {
    frequency: "weekdays",
    targetType: "boolean",
    entries: [...weekdayEntries]
};

// Friday evening: completed Friday
const statsFri = computeHabitStats(habitWeekdays, new Date(2026, 8, 11));
assert(statsFri.currentStreak === 5, `Friday streak is 5 (got ${statsFri.currentStreak})`);

// Saturday (rest day): streak must NOT drop to 0, remains alive at 5
const statsSat = computeHabitStats(habitWeekdays, new Date(2026, 8, 12));
assert(statsSat.currentStreak === 5, `Saturday (rest day) streak remains 5 (got ${statsSat.currentStreak})`);

// Sunday (rest day): streak must still remain alive at 5
const statsSun = computeHabitStats(habitWeekdays, new Date(2026, 8, 13));
assert(statsSun.currentStreak === 5, `Sunday (rest day) streak remains 5 (got ${statsSun.currentStreak})`);

// Monday morning before checking in: grace period keeps streak alive at 5
const statsMonMorning = computeHabitStats(habitWeekdays, new Date(2026, 8, 14));
assert(statsMonMorning.currentStreak === 5, `Monday morning grace period streak is 5 (got ${statsMonMorning.currentStreak})`);

// Monday after user marks completed: streak smoothly increments to 6!
habitWeekdays.entries.push({ dateStr: "2026-09-14", value: 1 });
const statsMonDone = computeHabitStats(habitWeekdays, new Date(2026, 8, 14));
assert(statsMonDone.currentStreak === 6, `Monday completed streak is 6 (got ${statsMonDone.currentStreak})`);
assert(statsMonDone.bestStreak === 6, `All-time best streak is 6 (got ${statsMonDone.bestStreak})`);

console.log("\n--- TEST 3: Weekends Habit (Across Multiple Weeks) ---");
const weekendEntries = [
    { dateStr: "2026-09-05", value: 1 }, // Sat
    { dateStr: "2026-09-06", value: 1 }, // Sun
    { dateStr: "2026-09-12", value: 1 }, // Sat
    { dateStr: "2026-09-13", value: 1 }  // Sun
];
const habitWeekend = { frequency: "weekends", targetType: "boolean", entries: weekendEntries };

// Mid-week on Wednesday: streak should stay alive at 2 from previous weekend
const statsMidWeek = computeHabitStats({
    frequency: "weekends",
    targetType: "boolean",
    entries: [{ dateStr: "2026-09-05", value: 1 }, { dateStr: "2026-09-06", value: 1 }]
}, new Date(2026, 8, 9));
assert(statsMidWeek.currentStreak === 2, `Mid-week streak for weekend habit is 2 (got ${statsMidWeek.currentStreak})`);

// Sunday 2026-09-13 after both weekends completed
const statsSun2 = computeHabitStats(habitWeekend, new Date(2026, 8, 13));
assert(statsSun2.currentStreak === 4, `Multi-week weekend streak is 4 (got ${statsSun2.currentStreak})`);

console.log("\n--- TEST 4: Proportional 30-Day Completion Rate ---");
const allWeekdayEntries = [];
const refDate = new Date(2026, 8, 11);
for (let i = 0; i < 30; i++) {
    const d = new Date(refDate);
    d.setDate(refDate.getDate() - i);
    const ds = toDateStr(d);
    if (isScheduledDay(ds, "weekdays")) {
        allWeekdayEntries.push({ dateStr: ds, value: 1 });
    }
}
const stats100 = computeHabitStats({ frequency: "weekdays", targetType: "boolean", entries: allWeekdayEntries }, refDate);
assert(stats100.completionRate30 === 100, `100% weekdays adherence produces 100% completion rate (got ${stats100.completionRate30}%)`);

console.log("\n==================================================");
console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! EVERYTHING WORKS!");
console.log("==================================================");
