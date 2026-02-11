import express from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  createRequest,     // ✅ add
  trackRequest,      // ✅ optional but recommended
  listRequests,
  approveRequest,
  rejectRequest,
} from "../controller/request.controller.js";

const router = express.Router();


router.post("/", createRequest);


router.get("/track/:code", trackRequest);

router.get("/", requireAdmin, listRequests);
router.patch("/:id/approve", requireAdmin, approveRequest);
router.patch("/:id/reject", requireAdmin, rejectRequest);

export default router;