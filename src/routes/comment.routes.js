import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import  {getVideoComments, addComment, updateComment, deleteComment } from "../controllers/comments.controller.js"


const commentRouter = Router()
commentRouter.use(verifyJWT)
commentRouter.route("c/:commentId").patch(updateComment).delete(deleteComment)
commentRouter.route("/v/:videoId").get(getVideoComments).post(addComment)

export default commentRouter