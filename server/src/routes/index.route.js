import { Router } from "express";
import DemoRoute from '../modules/Demo/demo.route.js'
const router = Router();

router.use('/demo' , DemoRoute)

export default router;
