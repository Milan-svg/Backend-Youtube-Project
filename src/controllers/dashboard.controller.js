import mongoose from "mongoose"
import {video} from "../models/video.model.js"
import {subscription} from "../models/subscription.model.js"
import {like} from "../models/like.model.js"
import {ApiError} from '../utils/apiError.js'
import { ApiResponse } from "../utils/apiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import {user} from "../models/user.model.js"
const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    /* 1. so we'll use current user as the userid obv.
       2. count the watch history documents to find video views
       3. search the userid in subscription as a channel and count resulting documents to get subscribers.
       4. also get number of channels user has subscribed to, using lookup.
       4. lookup in video model for the owner field as userId and count the documents to get total videos
       5. lookup in like model for owner field to get total likes, and in the tweet model to get total tweets. 
    */
   const userDetails =  await user.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.loggedInUser._id)
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"channelsSubbedTo"
            }
        },
        {
            $lookup:{
                from:"videos",
                localField: "_id",
                foreignField: "owner",
                as: "userVideos",
                pipeline:[
                    {
                        $project:{
                            title:1,
                            description:1,
                            createdAt:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField: "_id",
                foreignField: "likedBy",
                as: "userLikes"
            }
        },
        {
            $lookup:{
                from:"tweets",
                localField: "_id",
                foreignField: "owner",
                as: "userTweets",
                pipeline:[
                    {
                        $project:{
                            content:1,
                            createdAt:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelsSubbedToCount:{
                    $size: "$channelsSubbedTo"
                },
                videos: "$userVideos",
                userLikes: "$userLikes",
                userTweets: "$userTweets"
            }
        },
        {
            $project:{
                subscriberCount:1,
                channelsSubbedToCount:1,
                videos:1,
                userLikes:1,
                userTweets:1
            }
        }
    ])
    if(userDetails.length === 0){
        return res.status(200).json(new ApiResponse(200, [], "details not found"))
    }
    return res.status(200).json(new ApiResponse(200, userDetails, "details fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel, lookup in the video model for owner field as the channel id, project the fields
    const uploadedVideos = await user.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.loggedInUser._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as:"userVideos",
                pipeline:[
                    {
                        $project:{
                            videoFile:1,
                            thumbnail:1,
                            title:1,
                            description:1,
                            duration:1,
                            views:1,
                            createdAt:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                userVideos : "$userVideos"
            }
        }
    ])
    if(uploadedVideos.length === 0){
        return res.status(200).json(new ApiResponse(200, [], "videos not found"))
    }

    return res.status(200).json(new ApiResponse(200, uploadedVideos, "videos successfully fetched"))
})

export {
    getChannelStats, 
    getChannelVideos
    }