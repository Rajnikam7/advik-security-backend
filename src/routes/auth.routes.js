import express from "express";
import {
  register,
  testLoginUser,
  verifyOrCreateUser,
  getProfile,
  editProfile,
} from "../controllers/auth.controller.js";
import { refreshAccessToken } from "../controllers/refreshToken.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/auth/test-login", testLoginUser);
router.post("/auth/verify-firebase", verifyOrCreateUser);
router.post("/auth/refresh-token", refreshAccessToken);

// Protected routes
router.patch("/auth/register", authMiddleware, register);
router.get("/profile", authMiddleware, getProfile);
router.patch("/profile", authMiddleware, editProfile);

export default router;
