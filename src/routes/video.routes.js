import { Router } from "express";
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {deleteVideo, getVideoById, publishAVideo, togglePublishStatus, updateVideo} from "../controllers/video.controller.js"

const videoRoute = Router()

videoRoute.route("/publishVideo").post( verifyJWT, upload.single("video"),publishAVideo)
videoRoute.route("/c/:videoId").get(getVideoById)
videoRoute.route("/update-video-details/c/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo)
videoRoute.route("/toggle-publish/c/:videoId").patch(verifyJWT, togglePublishStatus)
videoRoute.route("/delete/c/:videoId").delete(verifyJWT,deleteVideo )












export default videoRoute 