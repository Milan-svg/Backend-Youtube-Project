import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import  {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"

const subRouter = Router()
subRouter.use(verifyJWT)
subRouter.route("/c/:channelId").post(toggleSubscription).get(getUserChannelSubscribers)
subRouter.route("/s/:subId").get(getSubscribedChannels)

export default subRouter