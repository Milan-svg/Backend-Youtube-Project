import mongoose, {isValidObjectId} from "mongoose"
import {like} from "../models/like.model.js"
import {ApiError} from '../utils/apiError.js'
import { ApiResponse } from "../utils/apiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import {video} from "../models/video.model.js"
import {comment} from "../models/comment.model.js"
import {tweet} from "../models/tweet.model.js"
import { application } from "express";


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    /* 1. validate id, check if theres already a field containing the videoId, if yes, delete the field, if not, create a new field. */

    if(!isValidObjectId(videoId?.trim())){
        throw new ApiError(400, "invalid video id")
    }
    const DoesVideoExist = await video.findById(videoId.trim())
    if(!DoesVideoExist){
        throw new ApiError(404, "video doesnt exist")
    }
    const isLiked = await like.findOne(
        {
            video: videoId,
            likedBy: req.loggedInUser._id

        }
    )
    if(isLiked){
        await like.findByIdAndDelete(isLiked._id)
        return res.status(200).json(new ApiResponse(200, isLiked, "like succesfully removed"))
    }
    const videoLike = await like.create({
        video: videoId,
        likedBy: req.loggedInUser._id
    })
    if(!videoLike){
        throw new ApiError(500, "something went wrong while creating the like document")
    }
    return res.status(200).json(new ApiResponse(200, videoLike, "like successfully toggled"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId?.trim())){
        throw new ApiError(400, "invalid comment id")
    }
    const doesCommentExist = await comment.findById(commentId)
    if(!doesCommentExist){
        throw new ApiError(404, "comment doesnt exist")
    }
    const isAlreadyLiked = await like.findOne({
        comment: commentId,
        likedBy : req.loggedInUser._id
    })
    if(isAlreadyLiked){
        const deleteLike = await like.findByIdAndDelete(isAlreadyLiked._id)
        if(!deleteLike){
            throw new ApiError(500, "error while deleting the like")
        }
        return res.status(200).json(new ApiResponse(200, deleteLike, "comment like successfully removed"))
    }
    const commentLike = await like.create({
        comment: commentId,
        likedBy: req.loggedInUser._id
    })
    if(!commentLike){
        throw new ApiError(500, "error while registering the like")
    }
    return res.status(200).json(new ApiResponse(200, commentLike, "comment like successfully registered"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId?.trim())){
        throw new ApiError(400, "invalid tweet id")
    }
    const doesTweetExist = await tweet.findById(tweetId.trim())
    if(!doesTweetExist){
        throw new ApiError(404, "tweet doesnt exist")
    }
    const isAlreadyLiked = await like.findOne({
        tweet: tweetId,
        likedBy: req.loggedInUser._id
    })
    if(isAlreadyLiked){
        const deleteLike = await like.findByIdAndDelete(isAlreadyLiked._id)
        if(!deleteLike){
            throw new ApiError(500, "error while deleting the like")
        }
        return res.status(200).json(new ApiResponse(200, deleteLike, "tweet like successfully removed"))

    }
    const tweetLike = await like.create({
        tweet: tweetId,
        likedBy: req.loggedInUser._id
    })
    if(!tweetLike){
        throw new ApiError(500, "error while registering the like")
    }
    return res.status(200).json(new ApiResponse(200, tweetLike, "tweet like successfully registered"))

}
)

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideos = await like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.loggedInUser._id)
            }
        },
        {
            $project:{
                video:1
            }
        }
    ])
    if(likedVideos.length === 0){
        return res.status(200).json(new ApiResponse(200, [], "no liked videos found"))
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideos, "liked videos successfully fetched")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}