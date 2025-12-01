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
router.get('/dashboard/stats', authorizeRoles('super-admin', 'employee'), getDashboardStats);

// User management
router.get('/users', authorizeRoles('super-admin', 'employee'), getAllUsers);
router.get('/users/:userId', authorizeRoles('super-admin', 'employee'), getUserById);
router.put('/users/:userId/role', authorizeRoles('super-admin'), updateUserRole);

export default router;
