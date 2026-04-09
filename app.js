import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { connectToDatabase } from "./src/db/index.js";
import { initializeFirebase } from "./src/config/firebase.js";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize Firebase
initializeFirebase();

const app = express();
connectToDatabase();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  cors({
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Serve static files from uploads directory
app.use("/uploads", express.static(uploadDir));

import authRoutes from "./src/routes/auth.routes.js";
import serviceTypeRoutes from "./src/routes/serviceType.routes.js";
import complaintRoutes from "./src/routes/complaint.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import employeeRoutes from "./src/routes/employee.routes.js";

const staticRoutes = [
  authRoutes,
  serviceTypeRoutes,
  complaintRoutes,
  adminRoutes,
  employeeRoutes,
];

staticRoutes.forEach((route) => {
  app.use("/api/security", route);
});

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
