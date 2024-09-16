import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js"

const tweetRouter = Router()
tweetRouter.use(verifyJWT)

tweetRouter.route("/create").post(createTweet)
tweetRouter.route("/get/:userId").get(getUserTweets)
tweetRouter.route("/:tweetId").patch(updateTweet).delete(deleteTweet)

export default tweetRouter