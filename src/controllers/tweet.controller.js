import mongoose, { isValidObjectId } from "mongoose"
import {tweet} from "../models/tweet.model.js"
import {user} from "../models/user.model.js"
import {ApiError} from '../utils/apiError.js'
import { ApiResponse } from "../utils/apiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    if(content?.trim() === ""){
        throw new ApiError(400, "content required")
    }
    const newTweet = await tweet.create({
        content : content,
        owner: req.loggedInUser._id
    })
    if(!newTweet){
        throw new ApiError(500, "issue during publishing the tweet")
    }
    return res.status(200).json(new ApiResponse(200, newTweet, "tweet successfully published"))

})

const getUserTweets = asyncHandler(async (req, res) => {

   const {userId} = req.params
   if(!isValidObjectId(userId?.trim())){
    throw new ApiError(400, "invalid userid")
   }
   const doesUserExist = await user.findById(userId.trim())
   if(!doesUserExist){
    throw new ApiError(404, "user doesnt exist")
   }
   const userTweetsArray = await tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project:{
                content:1
            }
        }
    ])
    if(userTweetsArray.length === 0){
        return res.status(200).json(new ApiResponse(200, [], "no tweets found"))
    }
    return res.status(200).json(new ApiResponse(200, userTweetsArray, "tweets successfully fetched"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    if(content?.trim() === ""){
        throw new ApiError(400, "content required")
    }
    if(!isValidObjectId(tweetId?.trim())){
        throw new ApiError(400, "invalid tweet id")
    }
    const updatedTweet = await tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content: content
            }
        },
        {
            new:true
        }
    )
    if(!updatedTweet){
        throw new ApiError(500, "there was an issue during updating the tweet")
    }
    return res.status(200).json(new ApiResponse(200, updatedTweet, "tweet successfully updated"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId.trim())){
        throw new ApiError(400, "invalid tweet id")
    }
    const tweetDelete = await tweet.findByIdAndDelete(tweetId)
    if(!tweetDelete){
        throw new ApiError(500, "error while deleting the tweet")
    }
    return res.status(200).json(new ApiResponse(200, tweetDelete,"tweet succesfully deleted"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}