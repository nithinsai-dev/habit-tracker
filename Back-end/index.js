import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import habitRoutes from "./routes/habit.js";

dotenv.config()

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

app.use("/api/habits", habitRoutes);

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("Connected to Mongo db");
}).catch((err) => {
    console.log(err.message);
});

app.get("/", (req, res) => {
    res.json({ message: "Hello World" })
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});