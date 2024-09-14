import mongoose, {isValidObjectId} from "mongoose"
import {playlist} from "../models/playlist.model.js"
import {ApiError} from '../utils/apiError.js'
import { ApiResponse } from "../utils/apiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name , description} = req.body
    /* 1. name description validate kro
       2. playlist create kro with the name, description, and owner
       3.  return a response.*/
    console.log(req.body)
    if(!name?.trim()){
        throw new ApiError(400, "name is required")
    }
    const Playlist = await playlist.create({
        name: name,
        description: description,
        owner: req.loggedInUser._id
    })
    if(!Playlist){
        throw new ApiError(500, "error while creating the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, Playlist, "Playlist created succesfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    // get user playlists
    if(!isValidObjectId(userId?.trim())){
        throw new ApiError(404, "invalid userId, Sign in or try logging in again")
    }
    //console.log(userId)
    const userPlaylists = await playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project:{
                name:1,
                description:1,
                videos:1,
                owner:1
            }
        }
    ])
    if(userPlaylists.length === 0){
        throw new ApiError(404, "playlist not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, userPlaylists, "playlists fetched succesfully")
    )


})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId?.trim())){
        throw new ApiError(400, "invalid playlist id")
    }
    const Playlist = await playlist.findById(playlistId)
    if(!Playlist){
        throw new ApiError(404), "playlist could not be found"
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, Playlist, "playlist fetched succesfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    /* 1.playlist and video id verify
       2. fetch the playlist via the playlist id, validate it
       3. add the video, validate it, return the updated playlist
     */
    if(!isValidObjectId(playlistId?.trim())){
        throw new ApiError(400, "invalid playlist id")
    }
    if(!isValidObjectId(videoId?.trim())){
        throw new ApiError(400, "invalid video id")
    }
    const doesPlaylistExist = await playlist.findById(playlistId)
    if(!doesPlaylistExist){
        throw new ApiError(404, "playlist not found")
    }
    const updatedPlaylist = await playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{ videos : videoId}
        },
        {
            new:true
        }
    );
    if(!updatedPlaylist){
        throw new ApiError(500, "video could not be added")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "video added successfully" )
    )

    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId?.trim())){
        throw new ApiError(400, "invalid playlist id")
    }
    if(!isValidObjectId(videoId?.trim())){
        throw new ApiError(400, "invalid video id")
    }
    const doesPlaylistExist = await playlist.findById(playlistId)
    if(!doesPlaylistExist){
        throw new ApiError(404, "playlist not found")
    }
    const updatedPlaylist = await playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{ videos: videoId}
        },
        {
            new:true
        }
    )
    if(!updatedPlaylist){
        throw new ApiError(400, "video could not be deleted :(")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "video deleted successfully")
    )

    

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId?.trim())){
        throw new ApiError(400, "invalid playlist id")
    }
    const deletionResult = await playlist.findByIdAndDelete(playlistId)
    if(!deletionResult){
        throw new ApiError(500, "playlist could not be found/ has already been deleted")
    } 
    return res
    .status(200)
    .json(
        new ApiResponse(200, deletionResult, "playlist deleted successfully")
    )
    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!isValidObjectId(playlistId?.trim())){
        throw new ApiError(400, "invalid playlist id")
    }

    if(!name || !description){
        throw new ApiError(400, "all fields are required")
    }
    const doesPlaylistExist = await playlist.findById(playlistId)
    if(!doesPlaylistExist){
        throw new ApiError(404, "playlist not found")
    }
    const updatedPlaylist = await playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name: name,
                description: description
            }
        },
        {
            new:true
        }
    )
    if(!updatedPlaylist){
        throw new ApiError(500, "playlist could not be updated")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "playlist details updated successfully")
    )


})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}