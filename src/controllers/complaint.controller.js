import Complaint from "../models/complaint.modal.js";
import ServiceType from "../models/serviceType.model.js";

// Create complaint (Customer) - with image upload
export const createComplaint = async (req, res) => {
  try {
    const {
      serviceType,
      servicePriority,
      subject,
      description,
      location,
    } = req.body;
    const customerId = req.user.id;

    if (!serviceType) {
      return res.status(400).json({ message: "Service type is required" });
    }

    if (!servicePriority) {
      return res.status(400).json({ message: "Service priority is required" });
    }

    // Verify service type exists
    const service = await ServiceType.findById(serviceType);
    if (!service || service.isDeleted || !service.isActive) {
      return res.status(400).json({ message: "Invalid service type" });
    }

    // Validate servicePriority and get pricing
    const selectedPriority = service.servicePriorities.find(
      (p) => p.servicePriority === servicePriority
    );

    if (!selectedPriority) {
      return res.status(400).json({
        message: "Invalid service priority for this service type",
        availablePriorities: service.servicePriorities.map((p) => p.servicePriority),
      });
    }

    // Generate URLs for uploaded files
    const attachmentUrls = req.files ? req.files.map((file) => {
      return `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
    }) : [];

    const complaint = await Complaint.create({
      serviceType,
      servicePriority,
      pricing: selectedPriority.pricing,
      customerId,
      subject,
      description,
      location,
      attachmentUrl: attachmentUrls,
      status: "Open",
      paymentStatus: "pending",
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("serviceType", "serviceName description")
      .populate("customerId", "name email phone");

    res.status(201).json({
      message: "Complaint created successfully",
      data: populatedComplaint,
    });
  } catch (err) {
    console.error("Create complaint error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update payment status (After payment confirmation)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { paymentStatus, paymentId } = req.body;
    const customerId = req.user.id;

    if (!["success", "failed"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const complaint = await Complaint.findOne({
      _id: complaintId,
      customerId,
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.paymentStatus !== "pending") {
      return res.status(400).json({ message: "Payment already processed" });
    }

    complaint.paymentStatus = paymentStatus;
    complaint.paymentId = paymentId;

    if (paymentStatus === "success") {
      complaint.status = "Assigned";
    }

    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("serviceType", "serviceName description")
      .populate("customerId", "name email phone");

    res.status(200).json({
      message: "Payment status updated successfully",
      data: populatedComplaint,
    });
  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get user's complaints (Customer)
export const getUserComplaints = async (req, res) => {
  try {
    const customerId = req.user.id;

    const complaints = await Complaint.find({ customerId })
      .populate("serviceType", "serviceName description")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Complaints retrieved successfully",
      data: complaints,
    });
  } catch (err) {
    console.error("Get user complaints error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get single complaint by ID (Customer)
export const getComplaintById = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const customerId = req.user.id;

    const complaint = await Complaint.findOne({
      _id: complaintId,
      customerId,
    })
      .populate("serviceType", "serviceName description")
      .populate("customerId", "name email phone");

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

// Get all complaints (Admin)
export const getAllComplaints = async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user.role.includes("super-admin") && !req.user.role.includes("employee")) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    const { status, paymentStatus } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const complaints = await Complaint.find(filter)
      .populate("serviceType", "serviceName description")
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "All complaints retrieved successfully",
      data: complaints,
    });
  } catch (err) {
    console.error("Get all complaints error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update complaint status (Admin)
export const updateComplaintStatus = async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user.role.includes("super-admin") && !req.user.role.includes("employee")) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    const { complaintId } = req.params;
    const { status } = req.body;

    if (!["Open", "Assigned", "InProgress", "Resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Only allow status update if payment is successful
    if (complaint.paymentStatus !== "success" && status !== "Open") {
      return res.status(400).json({
        message: "Cannot update status until payment is successful",
      });
    }

    complaint.status = status;
    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("serviceType", "serviceName description")
      .populate("customerId", "name email phone");

    res.status(200).json({
      message: "Complaint status updated successfully",
      data: populatedComplaint,
    });
  } catch (err) {
    console.error("Update complaint status error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
