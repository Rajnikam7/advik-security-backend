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

// Get complaint by ID (Admin only)
export const getComplaintById = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId)
      .populate("serviceType", "serviceName description")
      .populate("customerId", "name email phone")
      .populate("assignedTo", "name email phone role")
      .populate("statusHistory.updatedBy", "name");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.status(200).json({
      message: "Complaint retrieved successfully",
      data: complaint,
    });
  } catch (err) {
    console.error("Get complaint by ID error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Assign complaint to employee (Admin only)
export const assignComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { employeeId } = req.body;

    // Verify employee exists and has employee role
    const employee = await User.findById(employeeId);
    if (!employee || employee.isDeleted || employee.role !== 'employee') {
      return res.status(400).json({ message: "Invalid employee ID" });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Update complaint
    complaint.assignedTo = employeeId;
    complaint.status = "Assigned";
    
    // Add to status history
    complaint.statusHistory.push({
      status: "Assigned",
      timestamp: new Date(),
      updatedBy: req.user.id,
      notes: `Assigned to ${employee.name}`,
    });
    
    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("serviceType", "serviceName description")
      .populate("customerId", "name email phone")
      .populate("assignedTo", "name email phone role")
      .populate("statusHistory.updatedBy", "name");

    res.status(200).json({
      message: "Complaint assigned successfully",
      data: populatedComplaint,
    });
  } catch (err) {
    console.error("Assign complaint error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update complaint status (Admin only)
export const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, notes } = req.body;

    if (!["Open", "Assigned", "InProgress", "Resolved", "Closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = status;
    
    // Add to status history
    complaint.statusHistory.push({
      status: status,
      timestamp: new Date(),
      updatedBy: req.user.id,
      notes: notes || "",
    });
    
    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("serviceType", "serviceName description")
      .populate("customerId", "name email phone")
      .populate("assignedTo", "name email phone role")
      .populate("statusHistory.updatedBy", "name");

    res.status(200).json({
      message: "Complaint status updated successfully",
      data: populatedComplaint,
    });
  } catch (err) {
    console.error("Update complaint status error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all employees (for assignment dropdown)
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ 
      role: 'employee', 
      isDeleted: false 
    })
    .select('name email phone')
    .sort({ name: 1 });

    res.status(200).json({
      message: "Employees retrieved successfully",
      data: employees,
    });
  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Register new employee (Super-admin only)
export const registerEmployee = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validation
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        message: "Name, email, and phone are required" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phone }
      ],
      isDeleted: false
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: "User with this email or phone already exists" 
      });
    }

    // Create new employee
    const employee = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      role: 'employee',
      isVerified: true, // Admin-created employees are pre-verified
    });

    // Return employee data without sensitive fields
    const employeeData = {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      createdAt: employee.createdAt,
    };

    res.status(201).json({
      message: "Employee registered successfully",
      data: employeeData,
    });
  } catch (err) {
    console.error("Register employee error:", err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        message: `${field} already exists`,
      });
    }
    
    res.status(500).json({ message: "Server Error" });
  }
};

// Update payment status (Admin only)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { paymentStatus, paymentId, notes } = req.body;

    if (!["pending", "success", "failed"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const oldPaymentStatus = complaint.paymentStatus;
    complaint.paymentStatus = paymentStatus;
    
    if (paymentId) {
      complaint.paymentId = paymentId;
    }

    // Add to status history
    complaint.statusHistory.push({
      status: complaint.status,
      timestamp: new Date(),
      updatedBy: req.user.id,
      notes: `Payment status updated from ${oldPaymentStatus} to ${paymentStatus}${notes ? `. ${notes}` : ''}`,
    });
    
    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("serviceType", "serviceName description")
      .populate("customerId", "name email phone")
      .populate("assignedTo", "name email phone role")
      .populate("statusHistory.updatedBy", "name");

    res.status(200).json({
      message: "Payment status updated successfully",
      data: populatedComplaint,
    });
  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
