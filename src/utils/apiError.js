class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something went wrong",
        errors=[],
        stack= ""
    ){
        super(message)   //message standard argument hai when working w nodeJs Error class.
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors
    }
}

export {ApiError}

/*super(message) isiliye daala cause we use super when calling attributes from our parent class.(Error in this case), and Error class in node/js only takes one argument that is, message. so we used super(message) and then defined our other arguments uske baad for our object(ApiError)*/


//stack - A string representing the stack trace (a record of the function calls that led to the error). 
//In the constructor, this.message = message is used to assign the value of the parameter message to the message property of the specific object (instance) you are creating.
//this.message refers to the property that belongs to the object being created.
//message is the parameter passed into the constructor function.

// for eg is code me 
/*app.get('/some-route', (req, res, next) => {
  try {
    // Some logic that might throw an error
    throw new ApiError(404, "Resource not found"); // <<---- idhar we pass
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
});*/