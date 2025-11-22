import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const generateAccessToken = (user, isProfileComplete) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      isProfileComplete,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET
    );

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const isProfileComplete = !!user.name && !!user.email && !!user.phone;
    const newAccessToken = generateAccessToken(user, isProfileComplete);

    // Update user's access token
    user.token = newAccessToken;
    await user.save();

    res.status(200).json({
      message: "Token refreshed successfully",
      token: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isProfileComplete,
      },
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};
