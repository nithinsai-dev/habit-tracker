import express from "express";
import Habit from "../models/habit.js";

const router = express.Router();

//Get all habits
router.get("/", async (req, res) => {
    try {
        const habits = await Habit.find();
        res.json(habits);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "server error" })
    }
})

//POST a new habit
router.post("/", async (req, res) => {
    const habit = new Habit({
        name: req.body.name
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
        res.redirect("/");
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "server error" });
    }
})

router.patch("/:id/complete", async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        habit.completed = !habit.completed;
        if (habit.completed) {
            habit.streak += 1;
        }
        await habit.save();
        res.json(habit);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "server error" });
    }
})

export default router;
