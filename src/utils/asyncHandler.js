const asyncHandler =(fn)=>{
    return (req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch((err)=>next(err))
    }
}







export {asyncHandler}



//asyncHandler is basically ek wrapper hai jo hamare sare async functions ka try-catch manage krleta hai, and next(err) use krke automatically next error handling middleware ko error pass krdeta hai.

// iske bina  we'd have to manually do try-catch in every async func we write.

//TRY/CATCH method, upar we've used promise method, simple.
//const asyncHandler = () => { () => {} } --> const asyncHandler = () => () => {} basically higher order function use kar rhe hai. (those who take a func as a parameter)

/*const asyncHandler =(fn) => async(req,res,next) =>{
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
    }
}*/