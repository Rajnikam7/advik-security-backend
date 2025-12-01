import express from 'express';
import {
  getAllUsers,
  getUserById,
  getDashboardStats,
  updateUserRole,
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

export default router;
