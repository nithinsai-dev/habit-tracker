import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    completed: { type: Boolean, default: false },
    streak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastCompletedDate: { type: Date, default: null },
    entries: [
        {
            date: { type: Date, required: true },
            dateStr: { type: String }, // 'YYYY-MM-DD' formatted for timezone-stable comparison
            note: { type: String, default: '' },
            value: { type: Number, default: 1 },
            isFreeze: { type: Boolean, default: false }
        }
    ],
    targetType: {
        type: String,
        enum: ['boolean', 'numeric'],
        default: 'boolean'
    },
    targetValue: {
        type: Number,
        default: 1
    },
    unit: {
        type: String,
        default: 'times',
        trim: true
    },
    category: {
        type: String,
        enum: ['Career', 'Health', 'Fitness', 'Finance', 'Learning', 'General'],
        default: 'General'
    },
    color: {
        type: String,
        default: '#8b7cff'
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekdays', 'weekends'],
        default: 'daily'
    },
    isArchived: {
        type: Boolean,
        default: false,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }
}, { timestamps: true });

export default mongoose.model("Habit", habitSchema);
