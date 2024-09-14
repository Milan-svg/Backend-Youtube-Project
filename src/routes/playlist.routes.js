import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import  {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js"

const playlistRouter = Router()
playlistRouter.use(verifyJWT)   

playlistRouter.route("/create").post(createPlaylist)
playlistRouter.route("/user/:userId").get(getUserPlaylists)
playlistRouter.route("/:playlistId").get(getPlaylistById).patch(updatePlaylist).delete(deletePlaylist)
playlistRouter.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
playlistRouter.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)


export default playlistRouter





