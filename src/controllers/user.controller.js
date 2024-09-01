import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/apiError.js'
import {user} from "../models/user.model.js"
import {cloudinaryUpload} from '../utils/cloudinaryService.js'
import { ApiResponse } from "../utils/apiResponse.js";

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
    console.log("email:", email);
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

export {
    registerUser,
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
