import asyncHandler from "../../shared/utils/asyncHandler.js";
import roomController from "./room.controller.js";
import express from 'express'

const router = express.Router()

router.post('/create' , asyncHandler(roomController.createRoom.bind(roomController)) )

router.post('/join' , asyncHandler(roomController.joinRoom.bind(roomController)) )

router.patch('/:roomCode' , asyncHandler(roomController.renameRoom.bind(roomController)) )
router.ge

export default router