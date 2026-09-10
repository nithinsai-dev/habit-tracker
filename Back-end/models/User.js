import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    streakFreezesAvailable: {
        type: Number,
        default: 2
    },
    lastFreezeResetDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('User', userSchema);