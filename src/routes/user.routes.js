import { Router } from "express";
import {registerUser} from '../controllers/user.controller.js'
import {upload} from '../middlewares/multer.middleware.js'

const router = Router()

router.route("/register").post(
    upload.fields([ 
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    
    registerUser) 


//app.use("/api/v1/users", userRouter) use krke hum yaha aagye, now //users/register ke liye we have this. registerUser is a controller we defined in user.controller file.
// uploads multer ki file se aaya h, .fields liya cause we wanna upload multiple files from multiple fields, isiliye array hai, and iske andar objects.

// ye middleware hmne router.route("/register").post( {idhar inject kiya h, right before the register controller} , registerUser)


export default router