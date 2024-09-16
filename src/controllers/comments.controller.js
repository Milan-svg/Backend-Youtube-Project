import mongoose, { isValidObjectId } from "mongoose"
import {comment} from "../models/comment.model.js"
import {ApiError} from '../utils/apiError.js'
import { ApiResponse } from "../utils/apiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import {video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId?.trim())){
        throw new ApiError(400, "invalid video id")
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    const skip = (pageNum-1)* limitNum
    const doesVideoExist = await video.findById(videoId.trim())
    if(!doesVideoExist){
        throw new ApiError(404, "video does not exist")
    }
    const comments = await comment.find({video: videoId}).limit(limitNum).skip(skip).sort({createdAt: -1})
    if(comments.length === 0){
         new ApiResponse(200, "no comments found")
    }
    console.log(comments)

    return res
    .status(200)
    .json(
        new ApiResponse(200, comments, "comments fetched successfully")
    )

})

const addComment = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {videoId} = req.params
    if(!content){
        throw new ApiError(400, "content required to publish the comment")
    }
    if(!isValidObjectId(videoId?.trim())){
        throw new ApiError(400, "invalid video id")
    }

    const doesVideoExist = await video.findById(videoId?.trim())
    if(!doesVideoExist){
        throw new ApiError(404, "video does not exist")
    }
    const Comment = await comment.create({
        content: content,
        video: videoId,
        owner: req.loggedInUser._id
    })
    if(!Comment){
        throw new ApiError(500, "issue while creating comment document")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, Comment, "comment successfully published"))

})

const updateComment = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {commentId} = req.params
    if(!content){
        throw new ApiError(400, "content required to update the comment")
    }
    if(!isValidObjectId(commentId?.trim())){
        throw new ApiError(400, "invalid comment id")
    }
    const doesCommentExist = await comment.findById(commentId?.trim())
    if(!doesCommentExist){
        throw new ApiError(404, "comment document does not exist")
    }
    const updatedComment = await comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: content
            }
        },
        {
            new:true
        }
    )
    if(!updatedComment){
        throw new ApiError(500, "there was an issue while updating the comment")
    }
    res.status(200).json(new ApiResponse(200, updatedComment, "comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId?.trim())){
        throw new ApiError(400, "invalid comment id")
    }
    const doesCommentExist = await comment.findById(commentId?.trim())
    if(!doesCommentExist){
        throw new ApiError(404, "comment document does not exist")
    }

    if(!doesCommentExist.owner.equals(req.loggedInUser._id)){
        throw new ApiError(403, "unauthorized to delete the comment")
    }
    const deletedComment = await comment.findByIdAndDelete(commentId)
    if(!deletedComment){
        throw new ApiError(500, "error while deleting the comment")
    }
    res.status(200).json(new ApiResponse(200, deletedComment, "comment deleted successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }