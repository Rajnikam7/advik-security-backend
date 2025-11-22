import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { admin } from "../config/firebase.js";
import validator from "validator";

const generateAccessToken = (user, isProfileComplete) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      isProfileComplete,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' } // Short-lived access token
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '7d' } // Long-lived refresh token
  );
};

export const testLoginUser = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Only allow fixed test number + OTP
    if (phone !== "9999999999" || otp !== "999999") {
      return res.status(400).json({ message: "Invalid test credentials" });
    }

    // Check if user exists, else create
    let user = await User.findOne({ phone: `+91${phone}` });
    if (!user) {
      user = await User.create({
        phone: `+91${phone}`,
        isVerified: true,
        role: ["customer"],
      });
    }

    const isProfileComplete = !!user.name && !!user.phone && !!user.email;

    const accessToken = generateAccessToken(user, isProfileComplete);
    const refreshToken = generateRefreshToken(user);

    // Save tokens to user collection
    user.token = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      message: "Test user logged in successfully",
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        isProfileComplete,
      },
    });
  } catch (err) {
    console.error("testLoginUser error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOrCreateUser = async (req, res) => {
  try {
    const { firebaseToken } = req.body;
    if (!firebaseToken) {
      return res.status(400).json({ message: "Firebase token is required" });
    }

    // Check if Firebase is initialized
    if (!admin.apps.length) {
      return res.status(503).json({
        message:
          "Firebase authentication not configured. Use /test-login endpoint for development.",
      });
    }

    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const phone = decoded.phone_number;

    if (!phone) {
      return res.status(400).json({ message: "Phone number missing in token" });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        phone,
        isVerified: true,
        role: ["customer"],
      });
    }

    const isProfileComplete = !!user.name && !!user.email && !!user.phone;

    const accessToken = generateAccessToken(user, isProfileComplete);
    const refreshToken = generateRefreshToken(user);

    user.token = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      message: "User verified or created",
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        isProfileComplete,
      },
    });
  } catch (err) {
    console.error("verifyOrCreateUser error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Register Controller - Complete user profile after OTP verification
export const register = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id || req.user.id;

    console.log('Register request:', { name, email, userId });

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    user.name = name;
    user.email = email;

    const isProfileComplete = !!user.name && !!user.email && !!user.phone;
    const accessToken = generateAccessToken(user, isProfileComplete);
    const refreshToken = generateRefreshToken(user);

    user.token = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    console.log('Registration successful:', user._id);

    res.status(200).json({
      message: "Registration completed successfully",
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isProfileComplete,
      },
    });
  } catch (err) {
    // Duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate field value",
        field: err.keyPattern,
        value: err.keyValue,
      });
    }

    console.error("Register Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -token");
    const isProfileComplete = !!user.name && !!user.email && !!user.phone;
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      data: {
        user,
        isProfileComplete,
      },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, phone } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();

    if (email !== undefined) {
      const normalized = email.trim().toLowerCase();
      if (!validator.isEmail(normalized)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      if (normalized !== (user.email || "").toLowerCase()) {
        const existing = await User.findOne({
          email: normalized,
          _id: { $ne: userId },
        });
        if (existing) {
          return res.status(409).json({ message: "Email already in use" });
        }
        updates.email = normalized;
      }
    }

    if (phone !== undefined) updates.phone = phone.trim();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("-password -token");

    res.status(200).json({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Edit profile error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};
