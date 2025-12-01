import User from "../models/user.model.js";
import Complaint from "../models/complaint.modal.js";

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = { isDeleted: false };

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password -token -refreshToken')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Users retrieved successfully",
      data: users,
      count: users.length,
    });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get user by ID (Admin only)
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -token -refreshToken');

    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's complaints
    const complaints = await Complaint.find({ customerId: userId })
      .populate('serviceType', 'serviceName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "User details retrieved successfully",
      data: {
        user,
        complaints,
        complaintsCount: complaints.length,
      },
    });
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get dashboard statistics (Admin only)
export const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const totalCustomers = await User.countDocuments({ role: 'customer', isDeleted: false });
    const totalEmployees = await User.countDocuments({ role: 'employee', isDeleted: false });

    // Total complaints
    const totalComplaints = await Complaint.countDocuments();
    const openComplaints = await Complaint.countDocuments({ status: 'Open' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'InProgress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
    const closedComplaints = await Complaint.countDocuments({ status: 'Closed' });

    // Recent complaints
    const recentComplaints = await Complaint.find()
      .populate('customerId', 'name phone email')
      .populate('serviceType', 'serviceName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent users
    const recentUsers = await User.find({ isDeleted: false })
      .select('-password -token -refreshToken')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      message: "Dashboard statistics retrieved successfully",
      data: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          employees: totalEmployees,
        },
        complaints: {
          total: totalComplaints,
          open: openComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints,
          closed: closedComplaints,
        },
        recent: {
          complaints: recentComplaints,
          users: recentUsers,
        },
      },
    });
  } catch (err) {
    console.error("Get dashboard stats error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update user role (Super-admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['customer', 'employee', 'super-admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      message: "User role updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Update user role error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
