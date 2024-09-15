import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit: "32kb"})) // 1. Json data accept krne ke liye eg- form data,& uski limit

app.use(express.urlencoded({limit: "16kb"}))//2. url se data accept krne ke liye

app.use(express.static("public")) //3. Middleware hai.used to serve static files to the client (html/css/js/imgs/pdfs/etc) directly from our directory("public" in this case) instead of generating em via the server.  

app.use(cookieParser())


//Routes import
import userRouter from './routes/user.routes.js';
import videoRoute from './routes/video.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import subRouter from './routes/subscription.routes.js';
import commentRouter from './routes/comment.routes.js';

//Routes Declaration

app.use("/api/v1/users", userRouter) 
app.use("/api/v1/videos",videoRoute)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/subscriptions", subRouter)
app.use("/api/v1/comments", commentRouter)






export default app;