import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit: "16kb"})) // 1. Json data accept krne ke liye eg- form data,& uski limit

app.use(express.urlencoded({limit: "16kb"}))//2.ab url se data accept krne ke liye

app.use(express.static) //3. Middleware hai.used to serve static files to the client (html/css/js/imgs/pdfs/etc) directly from our directory("public" in this case) instead of generating em via the server. reduces server load, and less complexity cause less routes are written.

app.use(cookieParser())//4. used this so mai apne server se user ke browser ki cookies access kar pau, and set bhi kar pau







export default app;