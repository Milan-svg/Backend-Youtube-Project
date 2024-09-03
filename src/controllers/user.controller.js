import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/apiError.js'
import {user} from "../models/user.model.js"
import {cloudinaryUpload} from '../utils/cloudinaryService.js'
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";


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

    const userObject = await user.create({                              //6, also await is imp
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
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}





//asyncHandler is basically ek wrapper hai jo hamare sare async functions ka try-catch manage krleta hai, and next(err) use krke automatically next error handling middleware ko error pass krdeta hai.

// asyncHandler ke bina we'd write the code like:

// const registerUser = async (req, res, next) => {
//     try {
//         res.status(200).json({
//             message: "ok"
//         });
//     } catch (err) {
//         // Forward the error to the next middleware (error-handling middleware)
//         next(err);
//     }
// };

//idhar manually try catch etc use krna pdega whenever we write an async code in the project
