import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    streak: { type: Number, default: 0 },
    lastCompletedDate: { type: Date, default: null },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export default mongoose.model("Habit", habitSchema);
