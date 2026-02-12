import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  createResourceRequest,
  trackResourceRequest,
  adminListResourceRequests,
  adminApproveResourceRequest,
  adminRejectResourceRequest,
  adminAddDelivery,
} from "../controller/resource.controller.js";

const router = express.Router();

const uploadDir = path.resolve("uploads/resource-deliveries");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({ storage });

// PUBLIC
router.post("/requests", createResourceRequest);
router.get("/requests/track/:code", trackResourceRequest);

// ADMIN
router.get("/admin/requests", requireAdmin, adminListResourceRequests);
router.patch("/admin/requests/:id/approve", requireAdmin, adminApproveResourceRequest);
router.patch("/admin/requests/:id/reject", requireAdmin, adminRejectResourceRequest);

// SEND BACK (FILE/LINK/NOTE) + AUTO-APPROVE happens in controller
router.post(
  "/admin/requests/:id/deliveries",
  requireAdmin,
  upload.single("file"),
  adminAddDelivery
);

export default router;