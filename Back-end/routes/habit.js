import express from "express";
import Habit from "../models/habit.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

//Get all habits
router.get("/", async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.userId });
        res.json(habits);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "server error" })
    }
});

//Get Seperate Habits
router.get("/:id", async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
        if (!habit) return res.status(404).json({ message: "Habit Not Found" });
        res.json(habit);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Server Error" });
    }
})

//POST a new habit
router.post("/", async (req, res) => {
    const habit = new Habit({
        name: req.body.name,
        description: req.body.description,
        userId: req.userId
    });
    try {
        await habit.save();
        res.json(habit);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "server error" });
    }
})

//DELETE a habit
router.delete("/:id", async (req, res) => {
    try {
        await Habit.findByIdAndDelete(req.params.id);
        res.json({ message: "Habit deleted Successfully" });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "server error" });
    }
})

router.patch("/:id/complete", async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        const today = new Date();
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Check already done today
        const alreadyDoneToday = habit.completedDates.some(date => {
            const d = new Date(date);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() === todayMidnight.getTime();
        });

        if (alreadyDoneToday) {
            return res.status(400).json({ message: "Already completed today" });
        }

        // Add today
        habit.completedDates.push(today);
        habit.lastCompletedDate = today;
        habit.completed = true;

        const uniqueDays = [...new Set(
            habit.completedDates.map(date => {
                const d = new Date(date);
                return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            })
        )].sort((a, b) => b - a); // newest first

        let streak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
            const diff = uniqueDays[i - 1] - uniqueDays[i];
            if (diff === 86400000) { // exactly 1 day in ms
                streak++;
            } else {
                break; // gap found, stop counting
            }
        }

        habit.streak = streak;

        await habit.save();
        res.json(habit);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "server error" });
    }
});

export default router;
