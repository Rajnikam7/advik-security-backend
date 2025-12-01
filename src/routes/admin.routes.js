import express from 'express';
import {
  getAllUsers,
  getUserById,
  getDashboardStats,
  updateUserRole,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  getAllEmployees,
  registerEmployee,
  updatePaymentStatus,
} from '../controllers/admin.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and super-admin or employee role
router.use(authMiddleware);

// Dashboard statistics
router.get('/admin/dashboard/stats', authorizeRoles('super-admin', 'employee'), getDashboardStats);

// User management
router.get('/admin/users', authorizeRoles('super-admin', 'employee'), getAllUsers);
router.get('/admin/users/:userId', authorizeRoles('super-admin', 'employee'), getUserById);
router.put('/admin/users/:userId/role', authorizeRoles('super-admin'), updateUserRole);

// Complaint management
router.get('/admin/complaints/:complaintId', authorizeRoles('super-admin', 'employee'), getComplaintById);
router.put('/admin/complaints/:complaintId/assign', authorizeRoles('super-admin', 'employee'), assignComplaint);
router.put('/admin/complaints/:complaintId/status', authorizeRoles('super-admin', 'employee'), updateComplaintStatus);
router.put('/admin/complaints/:complaintId/payment', authorizeRoles('super-admin', 'employee'), updatePaymentStatus);

// Employee management
router.get('/admin/employees', authorizeRoles('super-admin'), getAllEmployees);
router.post('/admin/employees', authorizeRoles('super-admin'), registerEmployee);

export default router;
