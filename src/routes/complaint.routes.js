import express from "express";
import {
  createComplaint,
  updatePaymentStatus,
  getUserComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaintStatus,
  submitFeedback,
} from "../controllers/complaint.controller.js";
import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Customer routes
router.post(
  "/complaints",
  authMiddleware,
  upload.array("attachmentUrl", 5),
  createComplaint
);
router.patch(
  "/complaints/:complaintId/payment",
  authMiddleware,
  updatePaymentStatus
);
router.get("/complaints", authMiddleware, getUserComplaints);
router.get("/complaints/:complaintId", authMiddleware, getComplaintById);
router.patch(
  "/complaints/:complaintId/feedback",
  authMiddleware,
  submitFeedback
);

// Admin routes
router.get(
  "/admin/complaints",
  authMiddleware,
  authorizeRoles("super-admin", "employee"),
  getAllComplaints
);
router.patch(
  "/admin/complaints/:complaintId/status",
  authMiddleware,
  authorizeRoles("super-admin", "employee"),
  updateComplaintStatus
);

export default router;
