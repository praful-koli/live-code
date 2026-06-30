import express from "express";
import participantController from "./participant.controller.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/:roomCode/participants",
  asyncHandler(participantController.getRoomParticipants.bind(participantController))
);

export default router;