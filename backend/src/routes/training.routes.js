import express from "express";
import {
  listTrainings,
  createTraining,
  deleteTraining,
  updateTraining,
  registerTraining,
  listAttendees, 
} from "../controller/training.controller.js";

const router = express.Router();

router.get("/", listTrainings);

router.post("/", createTraining);

router.patch("/:id", updateTraining);

router.delete("/:id", deleteTraining);

router.post("/:id/register", registerTraining);


router.get("/:id/attendees", listAttendees);

export default router;