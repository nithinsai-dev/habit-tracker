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
        const last = habit.lastCompletedDate;
        const today = new Date();

        // Normalize both to midnight for clean day comparison
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const alreadyDoneToday = last &&
            new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime() === todayMidnight.getTime();

        if (alreadyDoneToday) {
            return res.status(400).json({ message: "Already completed today" });
        }

        // Check if last completion was exactly yesterday
        const yesterdayMidnight = new Date(todayMidnight);
        yesterdayMidnight.setDate(todayMidnight.getDate() - 1);

        const lastMidnight = last
            ? new Date(last.getFullYear(), last.getMonth(), last.getDate())
            : null;

        const isConsecutive = lastMidnight &&
            lastMidnight.getTime() === yesterdayMidnight.getTime();

        // If consecutive, keep adding. If gap, reset to 1.
        habit.streak = isConsecutive ? habit.streak + 1 : 1;
        habit.completed = true;
        habit.lastCompletedDate = today;
        habit.completedDates.push(today);

        await habit.save();
        res.json(habit);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "server error" });
    }
});

export default router;
