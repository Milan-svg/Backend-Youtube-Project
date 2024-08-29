import { Router } from "express";
import {registerUser} from '../controllers/user.controller.js'

const router = Router()

router.route("/register").post(registerUser) //app.use("/api/v1/users", userRouter) use krke hum yaha aagye, now //users/register ke liye we have this. registerUser is a controller we defined in user.controller file.



export default router