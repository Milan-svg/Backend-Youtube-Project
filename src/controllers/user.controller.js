import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler( async (req,res) =>{
    res.status(200).json({
        message: "ok"
    })
})

export {registerUser}


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
