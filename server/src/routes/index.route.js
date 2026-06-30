import { Router } from "express";
import DemoRoute from '../modules/Demo/demo.route.js'
import roomRoute from '../modules/room/room.route.js'
import participantRoute from '../modules/participant/participant.route.js'
import documentRoute from '../modules/document/document.route.js'
const router = Router();

router.use('/demo' , DemoRoute)

router.use('/rooms' , roomRoute)
router.use('/rooms' , participantRoute)
router.use('/rooms' , documentRoute)

export default router;
