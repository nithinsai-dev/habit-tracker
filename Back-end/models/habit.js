import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    streak: { type: Number, default: 0 },
    lastCompletedDate: { type: Date, default: null },
    entries: [{ date: { type: Date, required: true }, note: { type: String, default: '' } }],
    category: {
        type: String,
        enum: ['Career', 'Health', 'Fitness', 'Finance', 'Learning', 'General'],
        default: 'General'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export default mongoose.model("Habit", habitSchema);
