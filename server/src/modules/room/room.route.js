import asyncHandler from "../../shared/utils/asyncHandler.js";
import roomController from "./room.controller.js";
import express from 'express'

const router = express.Router()

router.post('/create' , asyncHandler(roomController.createRoom.bind(roomController)) )

export default router