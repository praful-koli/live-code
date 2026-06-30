import { checkHost } from "../../middlewares/checkHost.middleware.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import roomController from "./room.controller.js";
import express from "express";

const router = express.Router();

router.post(
  "/create",
  asyncHandler(roomController.createRoom.bind(roomController)),
);

router.post(
  "/join",
  asyncHandler(roomController.joinRoom.bind(roomController)),
);

router.get(
  "/:roomCode",
  asyncHandler(roomController.getRoom.bind(roomController)),
);

router.patch(
  "/:roomCode/rename",
  checkHost,
  asyncHandler(roomController.renameRoom.bind(roomController)),
);

router.patch(
  "/:roomCode/lock",
  checkHost,
  asyncHandler(roomController.lockRoom.bind(roomController)),
);

router.patch(
  "/:roomCode/unlock",
  checkHost,
  asyncHandler(roomController.unlockRoom.bind(roomController)),
);

router.delete(
  "/:roomCode/delete",
  asyncHandler(roomController.closeRoom.bind(roomController)),
);

router.delete(
  "/:roomCode/participants/:participantId",
  checkHost,
  asyncHandler(roomController.removeParticipant.bind(roomController)),
);

export default router;
