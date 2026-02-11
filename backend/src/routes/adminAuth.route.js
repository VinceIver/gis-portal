import express from "express";
import { adminLogin, adminMe } from "../controller/adminAuth.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/me", requireAdmin, adminMe);

export default router;