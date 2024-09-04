//verify krega ki user h ya ni h.

import { user } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"


export const verifyJWT = asyncHandler(async (req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(401, "unauthorized request")
        }
        // jwt.verify takes 2 vals, 1- value to be decoded, 2- secret key
    
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET) 
    
        const loggedInUser = await user.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!loggedInUser){
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.loggedInUser = loggedInUser;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }

})

// token leke current user ka object (just a reference of the database's user obj ) bhej dere hai req me. (excluding the password and refreshtkn)



//kyuki login me we added cookies object to res,req se bhi we can access it.

// we'll decode this token to get _id value, _id se we can find the user object in the database, uske baad we can easily clear their cookies and reset refreshtoken, etc.
//why can we decode the token into _id ? --> see user.model me generateaccesstoken ka method!