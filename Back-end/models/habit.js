import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    streak: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now() },
    lastCompletedDate: { type: Date, default: null }
})

export default mongoose.model("Habit", habitSchema);
