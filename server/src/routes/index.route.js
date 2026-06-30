import { Router } from "express";
import DemoRoute from '../modules/Demo/demo.route.js'
import roomRoute from '../modules/room/room.route.js'
import participantRoute from '../modules/participant/participant.route.js'
const router = Router();

router.use('/demo' , DemoRoute)

router.use('/rooms' , roomRoute)
router.use('/rooms' , participantRoute)

export default router;
