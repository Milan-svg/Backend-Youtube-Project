import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit: "16kb"})) // 1. Json data accept krne ke liye eg- form data,& uski limit

app.use(express.urlencoded({limit: "16kb"}))//2. url se data accept krne ke liye

app.use(express.static("public")) //3. Middleware hai.used to serve static files to the client (html/css/js/imgs/pdfs/etc) directly from our directory("public" in this case) instead of generating em via the server.  

app.use(cookieParser())


//Routes import
import userRouter from './routes/user.routes.js';
import videoRoute from './routes/video.routes.js';

//Routes Declaration

app.use("/api/v1/users", userRouter)  ///api/v1/users load hote hi controll userRouter(user.routes) pe aajyega. then we can further write operations for "/users/x" mtlb /users ab prefix hogya. (see user.routes)

app.use("/api/v1/videos",videoRoute )





export default app;