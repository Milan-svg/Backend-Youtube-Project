import mongoose, {isValidObjectId} from "mongoose"
import {video} from "../models/video.model.js"
import {user} from "../models/user.model.js"
import {ApiError} from '../utils/apiError.js'
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {cloudinaryUpload, cloudinaryThumbnail ,cloudinaryFileDelete} from '../utils/cloudinaryService.js'


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    /* 1. get video from multer
       2. check if video exists, if yes, upload it to cloudinary
       3. again, check if it exists,
       4. cloudinary se vid ka url leke well add it to our video object
       5. return a response */
       

    const videoLocalPath = req.file?.path
    if(!videoLocalPath){
        throw new ApiError(404, "video file missing")
    }
    const videoUpload = await cloudinaryUpload(videoLocalPath)
    if(!videoUpload){
        throw new ApiError(400, "error while uploading video")
    }
    //console.log(videoUpload)

    const publicId = videoUpload.public_id;
    const thumbnailUrl = cloudinaryThumbnail(publicId);
    if(typeof thumbnailUrl!== 'string'){
        throw new ApiError(500, "failed to generate thumbnail url")
    }
    //console.log(thumbnailUrl)

    const videoObject = await video.create({
        videoFile: videoUpload.url,
        title,
        description,
        isPublished: true,
        thumbnail: thumbnailUrl,
        duration : videoUpload.duration,
        owner: req.loggedInUser._id
    })
    return res
    .status(200)
    .json(
        new ApiResponse(200, videoObject , "video uploaded succesfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!videoId?.trim()){
        throw new ApiError(400, "video id not valid")
    }

    const Video = await video.findById(videoId)
    if(!Video){
        throw new ApiError(404, "video not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, Video, "video object found!")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    /* TODO: update video details like title, description, thumbnail*/
    /* 1. videoId check krenge ki if it exists, also req.body se title, description lelenge,
       thumbnail ke liye research krni pdegi
       2. videoId se video object find krenge
       3. find krke findbyIdAndUpdate use krke details update krdenge.
       4. update krne ke liye we'll use $set */

    const {title, description} = req.body
    const thumbnailLocal = req.file?.path
    
    if(!videoId?.trim()){
        throw new ApiError(404, "video not found")
    }
    if(!thumbnailLocal){
        throw new ApiError(400, "thumbnail required!")
    }
    const Thumbnail = await cloudinaryUpload(thumbnailLocal)

    const Video = await video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title: title,
                description: description,
                thumbnail: Thumbnail.url
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, Video, "video details updated succesfully")
    )


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId?.trim()){
        throw new ApiError(404, "video could not be found")
    }
    const videoToDelete = await video.findById(videoId)
    const vidUrl = videoToDelete.videoFile
    //console.log(vidUrl)
    const publicId = vidUrl.split('/video/upload/')[1].split('.')[0];
    if(!publicId){
        throw new ApiError(500, "error while generating publicId from videoUrl")
    }
    console.log(publicId)

    const cloudinaryDeletionResult = await cloudinaryFileDelete(publicId)
    if(!cloudinaryDeletionResult){
        throw new ApiError(500, "could not delete from cloudinary")
    }
    console.log(cloudinaryDeletionResult)
    await video.findByIdAndDelete(videoId)
    return res
    .status(200)
    .json(
        new ApiResponse(200, "video deletion succesfull")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    /* 1. find the video by id
       2. check if id exists, then fetch the video object using  the id, to get a reference of
        isPublished of the video object.
       3. now we can use findbyidAndUpdate to toggle the isPublished cause we now have a ref of the 
        value via our previous findById */
    if(!videoId?.trim()){
        throw new ApiError(404, "video id not valid")
    }
    const videoToUpdate = await video.findById(videoId)
    if(!videoToUpdate){
        throw new ApiError(404, "video not found ")
    }

    const updatedVideo = await video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished: !videoToUpdate.isPublished
            }
        },
        {
            new:true
        }
    )


    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo,"Publish status toggled succesfully" )
    )
})



export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}