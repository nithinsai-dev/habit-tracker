import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import habitRoutes from "./routes/habit.js";
import authRoutes from './routes/authRoutes.js';

dotenv.config()

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3000;

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/habits", habitRoutes);
app.use('/api/auth', authRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack || err.message);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error"
    });
});

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/habittracker";
mongoose.connect(mongoUrl).then(() => {
    console.log("Connected to MongoDB successfully");
}).catch((err) => {
    console.error("MongoDB connection error:", err.message);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});