import mongoose, {isValidObjectId} from "mongoose"
import {user} from "../models/user.model.js"
import { subscription } from "../models/subscription.model.js"
import {ApiError} from '../utils/apiError.js'
import { ApiResponse } from "../utils/apiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    /* 1. as a current user we have to toggle the subscription for the channel
          being displayed(channelId) 
       2. we'll match the channel in subscription model with the channel id
       3. delete the document where the subscriber === req.loggedinuser._id */
    if(!isValidObjectId(channelId?.trim())){
        throw new ApiError(400, "invalid channel id")
    }
    const isAlreadySubscribed = await subscription.findOne({
        channel: channelId.trim(),
        subscriber: req.loggedInUser._id
    })
    if(isAlreadySubscribed){
        const deleteSubscription = await subscription.findOneAndDelete(
            {
                channel: channelId.trim(),
                subscriber: req.loggedInUser._id   
            }   
        )
        if(!deleteSubscription){
            throw new ApiError(500, "error while deleting subscription document")
        }
        return res.status(200).json(new ApiResponse(200,{}, "subscription deleted"))
    }
    const createdSubscription = await subscription.create({
        channel: channelId.trim(),
        subscriber: req.loggedInUser._id
    })

    if(!createdSubscription){
        throw new ApiError(500, "issue during creating the subscription document")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdSubscription, "subscription created!")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    /* 1. channelId validate, aggregation me match the channel with channelId
       2. project the documents with the channel id as channel, resulting in an array of 
          documents with channel as channelid and different subscribers */

    if(!isValidObjectId(channelId?.trim())){
        throw new ApiError(400 , "invalid channel id")
    }
    const doesChannelExist = await user.findById(channelId.trim())
    if(!doesChannelExist){
        throw new ApiError(404, "channel does not exist")
    }
    const subscriberArray = await subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId.trim())
            }
        },
        {
            $project:{
                subscriber:1
            }
        }
    ])
    if(subscriberArray.length === 0){
        return res.status(200).json(new ApiResponse(200, [], "no subscribers found"))
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscriberArray, "subscribers fetched successfully")
    )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId?.trim())){
        throw new ApiError(400, "invalid subscriberId")
    }
    const doesSubExist = await user.findById(subscriberId.trim())
    if(!doesSubExist){
        throw new ApiError(404, "user doesnt exist")
    }
    const channelArray = await subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId.trim())
            }
        },
        {
            $project:{
                channel:1
            }
        }
    ])
    if(channelArray.length === 0){
        res.status(200).json(new ApiResponse(200, [], "you havent subscribed to any channel yet"))
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channelArray, "channel list fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}