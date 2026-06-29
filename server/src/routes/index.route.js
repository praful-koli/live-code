import { Router } from "express";
import DemoRoute from '../modules/Demo/demo.route.js'
import roomRoute from '../modules/room/room.route.js'
const router = Router();

router.use('/demo' , DemoRoute)

router.use('/room' , roomRoute)

export default router;
