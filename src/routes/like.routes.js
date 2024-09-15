import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
} from "../controllers/like.controller.js"

const likeRouter = Router()
likeRouter.use(verifyJWT)

likeRouter.route("/v/:videoId").post(toggleVideoLike)
likeRouter.route("/c/:commentId").post(toggleCommentLike)
likeRouter.route("/t/:tweetId").post(toggleTweetLike)
likeRouter.route("/").get(getLikedVideos)

export default likeRouter