import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { connectToDatabase } from "./src/db/index.js";
import { initializeFirebase } from "./src/config/firebase.js";
import cors from "cors";

// Initialize Firebase
initializeFirebase();

const app = express();
connectToDatabase();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors({
  origin: ["http://localhost:8081", "http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
}));

import authRoutes from "./src/routes/auth.routes.js";

app.use("/api/advik-security", authRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
    },
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
