import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// REGISTER
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ message: "Email is already registered" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ email: normalizedEmail, password: passwordHash });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || "default_jwt_secret",
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Account created successfully",
            token,
            email: user.email
        });
    } catch (err) {
        console.error("Register error:", err.message);
        res.status(500).json({ message: "An error occurred during registration" });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || "default_jwt_secret",
            { expiresIn: "7d" }
        );

        res.json({
            token,
            email: user.email,
            id: user._id
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: "An error occurred during login" });
    }
});

// GET CURRENT USER
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ email: user.email, id: user._id });
    } catch (err) {
        console.error("Get /me error:", err.message);
        res.status(500).json({ message: "Failed to fetch user profile" });
    }
});

export default router;