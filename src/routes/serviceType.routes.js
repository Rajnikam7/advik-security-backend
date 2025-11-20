import express from "express";
import {
  createServiceType,
  getServiceTypes,
  updateServiceType,
  deleteServiceType,
} from "../controllers/serviceType.controller.js";
import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/service-types", authMiddleware, getServiceTypes);

router.post(
  "/service-types",
  authMiddleware,
  authorizeRoles("super-admin", "customer"),
  createServiceType
);

router.put(
  "/service-types/:id",
  authMiddleware,
  authorizeRoles("super-admin"),
  updateServiceType
);

router.delete(
  "/service-types/:id",
  authMiddleware,
  authorizeRoles("super-admin"),
  deleteServiceType
);

export default router;
