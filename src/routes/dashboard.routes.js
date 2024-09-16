import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getChannelStats, 
    getChannelVideos
    } from "../controllers/dashboard.controller.js"


const dashboardRouter = Router()
dashboardRouter.use(verifyJWT)

dashboardRouter.route("/Stats").get(getChannelStats)
dashboardRouter.route("/videos").get(getChannelVideos)


export default dashboardRouter