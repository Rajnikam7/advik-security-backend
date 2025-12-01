import express from 'express';
import {
  getEmployeeDashboard,
  getAssignedComplaints,
  getComplaintDetails,
  updateComplaintStatus,
} from '../controllers/employee.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and employee role
router.use(authMiddleware);
router.use(authorizeRoles('employee'));

// Employee dashboard
router.get('/employee/dashboard', getEmployeeDashboard);

// Complaint management
router.get('/employee/complaints', getAssignedComplaints);
router.get('/employee/complaints/:complaintId', getComplaintDetails);
router.put('/employee/complaints/:complaintId/status', updateComplaintStatus);

export default router;