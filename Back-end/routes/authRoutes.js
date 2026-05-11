import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", async (req, res) => {
    console.log(req.body)
    try {
        const { email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already in use' });

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({ email, password: passwordHash });

        res.status(201).json({ message: "Account Created Successfully" });
    } catch (err) {
        console.log('Register error:', err.message)
        res.status(500).json({ message: err.message })
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt:", email, password)
    try {

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, email: user.email });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;