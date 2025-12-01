import Complaint from "../models/complaint.modal.js";

// Get employee dashboard statistics
export const getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.user.id;

    // Get assigned complaints
    const assignedComplaints = await Complaint.find({ 
      assignedTo: employeeId 
    })
    .populate("serviceType", "serviceName description")
    .populate("customerId", "name email phone")
    .sort({ createdAt: -1 });

    // Get statistics
    const totalAssigned = assignedComplaints.length;
    const inProgress = assignedComplaints.filter(c => c.status === 'InProgress').length;
    const resolved = assignedComplaints.filter(c => c.status === 'Resolved').length;

    // Get recent resolved complaints
    const recentResolved = await Complaint.find({ 
      assignedTo: employeeId,
      status: 'Resolved'
    })
    .populate("serviceType", "serviceName description")
    .populate("customerId", "name email phone")
    .sort({ updatedAt: -1 })
    .limit(5);

    res.status(200).json({
      message: "Employee dashboard retrieved successfully",
      data: {
        statistics: {
          totalAssigned,
          inProgress,
          resolved,
        },
        assignedComplaints,
        recentResolved,
      },
    });
  } catch (err) {
    console.error("Get employee dashboard error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get assigned complaints for employee
export const getAssignedComplaints = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status } = req.query;

    const filter = { assignedTo: employeeId };
    if (status) {
      filter.status = status;
    }

    const complaints = await Complaint.find(filter)
      .populate("serviceType", "serviceName description")
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Assigned complaints retrieved successfully",
      data: complaints,
    });
  } catch (err) {
    console.error("Get assigned complaints error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get complaint details for employee
export const getComplaintDetails = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const employeeId = req.user.id;

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedTo: employeeId
    })
    .populate("serviceType", "serviceName description")
    .populate("customerId", "name email phone")
    .populate("assignedTo", "name email phone role")
    .populate("statusHistory.updatedBy", "name");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found or not assigned to you" });
    }

    res.status(200).json({
      message: "Complaint details retrieved successfully",
      data: complaint,
    });
  } catch (err) {
    console.error("Get complaint details error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update complaint status by employee
export const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, notes } = req.body;
    const employeeId = req.user.id;

    // Employees can only update to InProgress or Resolved
    if (!["InProgress", "Resolved"].includes(status)) {
      return res.status(400).json({ 
        message: "Employees can only update status to 'InProgress' or 'Resolved'" 
      });
    }

    const complaint = await Complaint.findOne({
      _id: complaintId,
      assignedTo: employeeId
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found or not assigned to you" });
    }

    complaint.status = status;
    
    // Add to status history
    complaint.statusHistory.push({
      status: status,
      timestamp: new Date(),
      updatedBy: employeeId,
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