import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/apiError.js'
import {user} from "../models/user.model.js"
import {cloudinaryUpload} from '../utils/cloudinaryService.js'
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshTokens = async (userId)=> {             
    try {
        const User = await user.findById(userId)        //User object bnaya from user.findbyid krke, access/refresh token return krwadiya
        const accessToken = await User.generateAcessToken()
        const refreshToken = await User.generateRefreshToken()

        User.refreshToken = refreshToken
        await User.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh/access tokens")
    }

}
const registerUser = asyncHandler( async (req,res) =>{
    //1. get user details from frontend, abhi postman se
    //2. data validate krenge- not empty
    //3. data validate - check if user already exists, username/email ke thru
    //4 check for files. ki multer middleware se file upload krayi thi, (see user.routes)ne  avatar & coverimage upload kiya ya ni kiya
    //5. agar available hai, toh upload em to cloudinary, check for avatar again. (kyuki req:true h)
    //cloudinary ki jo service banayi h udhar se response milega,
    //6. create user object (cuz nsql dbs me usually objects use aate h), create entry/call in db.
    //7. remove password and refresh token from response.
    //8.chck for user creation in db, if so, 
    //9. return response. 

    const {fullname, email, username, password} = req.body      // 1.

    if(                                                         //2.
        [fullname, email, username, password].some(
            (field)=>field?.trim() === "" )
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await user.findOne({                         //3. bug-- await ni lgaya tha,
        $or: [ {username}, {email}]
    })

    if(existingUser){
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;         //4.
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400 , "Avatar required!")
    }

    const avatar = await cloudinaryUpload(avatarLocalPath)       //5
    const coverImage = await cloudinaryUpload(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400 , "Avatar required!")
    }

    const userObject = await user.create({                              
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // avatar validated but coverimage not,so ? lgaya
        email,
        password,
        username : username.toLowerCase()
    })

    //check krenge ki user db me empty toh nhi

   const createdUser = await user.findById(userObject._id).select(       //7
    "-password -refreshToken"
   )
   if(!createdUser){                                                     //8
    throw new ApiError(500 , "Something went wrong while registering the user in db")
   }

   return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully!")
   )

})

const loginUser = asyncHandler(async (req, res)=> {
    //1. req. body se data lena
    //2. username/email check kro
    //3. find the user, ki req body me aa bhi rha ya ni
    //4. agar user milta, password check.
    //5. if password correct, generate access/refrsh tokn 
    //6. and send it to user via cookies

    const {email, username, password} = req.body
    if(!(username || email)){
        throw new ApiError(400, "email or username is required")
    }
    const foundUser = await user.findOne({
        $or: [{username} , {email}]
    })
    if(!foundUser){
        throw new ApiError(404, "User not found")
    }
    const isMatch = await foundUser.isPasswordCorrect(password)
    if(!isMatch){
        throw new ApiError(401, "password invalid")
    }
   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(foundUser._id)

   const loggedInUser = await user.findById(foundUser._id).select(" -password -refreshToken ")
   // options is an object for our cookies, httponly, secure true h so that cookies are editable only from our server.
   const options = {  
    httpOnly: true,
    secure: true
   }
   return res
   .status(200).cookie("accessToken" , accessToken , options)
   .cookie("refreshToken", refreshToken, options)
   .json(
    new ApiResponse(200,
        {                                   //aise obj send krne ke liye we used "data" in ApiResponse.
            user: loggedInUser, accessToken, refreshToken    
        }, "Login Succesfull!")
   )


})

const logoutUser = asyncHandler(async (req,res)=>{
    await user.findByIdAndUpdate(
        req.loggedInUser._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))

})

const refreshAccessToken = asyncHandler(async (req,res) => {
    // incoming token ko decode kiya, usse user obj nikala, nikale hue user ki refreshtoken ko incoming token se compare kiya
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Request")
    }

   try {
     const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
     
     const loggedInUser = await user.findById(decodedToken?._id)
     if(!loggedInUser){
         throw new ApiError(401, "invalid refresh token")
     }
 
     if(incomingRefreshToken!== loggedInUser?.refreshToken){
         throw new ApiError(401, "invalid refresh token")
     }
     const options = {
         httpOnly: true,
         secure: true
     }
     const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(loggedInUser._id)
 
     return res
     .status(200)
     .cookie("accessToken",accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new ApiResponse(200, {accessToken, refreshToken : newRefreshToken}, "Access token refreshed succesfully!")
     )
   } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token")
   }

    

    //toh baically incoming token ko decode krke user object nikala, now since login dete waqt we provide the user object with refresh and accesstoken, we compare user.refreshtoken (jo hamare database me hai) WITH incoming token.
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword , newPassword} = req.body
    const currentUser = await user.findById(req.loggedInUser._id)
    const isPassCorrect = await currentUser.isPasswordCorrect(oldPassword)

    if(!isPassCorrect){
        throw new ApiError(400, "Invalid Password")
    }
    currentUser.password = newPassword
    await currentUser.save({validateBeforeSave: false}) // IMP-- save krna mt bhoolna

    return res
    .status(200)
    .json(
        new ApiResponse(200, {},"Password changed succesfully ")
    )
})

const getCurrentUser = asyncHandler( async(req,res) => {
    return res
    .status(200)
    .json( new ApiResponse(200, req.loggedInUser , "current user fetched succesfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{

    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(400, "All fields are required")
    }
    const currentUser = await user.findByIdAndUpdate(
        req.loggedInUser._id,
        {
            $set:{
                fullname : fullname,
                email: email
            }
        },
        { new: true  }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, currentUser , "Account details updated successfully"))

    // WHY WE CANT DIRECTLY USE req.loggedInUser TO UPDATE INFO IN OUR DATABASE

    //agar database ke user object me koi bhi change krna ho, we HAVE to make a database call (like const user = await user.findbyID). Directly req.loggedInUser ko modify nahi kar sakte, cause thats just is a reference to the user object stored in memory (i.e., it's retrieved from the session, token, or middleware). Modifying this object directly will only change the in-memory representation of the user data within the current request, naaki the actual database object!!

    //By using this method, we're skipping the need to retrieve the user, modify it, and then call save. Instead, the update happens directly in the database.
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is missing")
    }
    //cloudinary se file delete bhi krni hogi-- TODO
    const avatar = await cloudinaryUpload(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar")
    }
    const currentUser = await user.findByIdAndUpdate(
        req.loggedInUser._id,
        {
            $set:{
                avatar : avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, currentUser , "avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "cover image file missing")
    }

    const coverImage = await cloudinaryUpload(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400, "error while uploading coverImage")
    }

    const currentUser = await user.findByIdAndUpdate(
        req.loggedInUser._id,
        {
            $set:{
                coverImage : coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, currentUser , "coverImage updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "username not found")
    }
    const channel = await user.aggregate([
        {
            $match:{
                username: username
            }
        }, //ab find krnge ki is user/username ke subscribers kitne hai
        {
            // search user as a channel (user ki id ko channels me search krenge, cause channel itself is a collection of users), so that we can get number of subscribers. (search krne par we'll get AN ARRAY OF multiple documents with -- channel(user) constant and other field being subscribers) , toh number of documents == number of subscribers, cause channel toh same hai. This ARRAY is being called "subscribers" here (as:). ye array user/channel ke document me add ho jayega.
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            // here were searching the user's _id in subscriber field. we'll get multiple documents with the subscriber field constant (equal to user's _id) , and other field being channels. number of documents found === number of channels the user has subscribed to.
            $lookup:{
                from:"subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "channelsSubscribedTo"
            }
        },
        {
            // idhar we've added two fields in the user document model. w the fields being the number of subscribers of the user, and number of channels the user has subscribed to.
            $addFields:{
                subscriberCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$channelsSubscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        // if me ye dekhenge ki displayed user ke jo subscribers aaye hai, usme mai hu ya nhi.
                        if:{ $in: [req.loggedInUser?._id , "$subscribers.subscriber"] },
                        //he documents in the subscribers array have a field called subscriber, which is the ObjectId of the user who is subscribed to the channel.
                        then: true,
                        else: false
                    }
                }

            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscriberCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }
        }

    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "channel fetched succesfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res) =>{
    const currentUser = await user.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.loggedInUser._id)
            }
        },
        {
            $lookup:{
                //When you use lookup with _id as the foreignField, the watchHistory join will contain the whole video documents, not just the _id values. The lookup operation is designed to retrieve the full documents from the videos collection that match the localField values.
                //For each ObjectId in the watchHistory field of the user document, the lookup will fetch the entire document from the videos collection that matches the corresponding _id.
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullname:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }

    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            currentUser[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}





/*asyncHandler is basically ek wrapper hai jo hamare sare async functions ka try-catch manage krleta hai, and next(err) use krke automatically next error handling middleware ko error pass krdeta hai.

asyncHandler ke bina we'd write the code like:

const registerUser = async (req, res, next) => {
    try {
        res.status(200).json({
            message: "ok"
        });
    } catch (err) {
        // Forward the error to the next middleware (error-handling middleware)
        next(err);
    }
};
idhar manually try catch etc use krna pdega whenever we write an async code in the project*/
