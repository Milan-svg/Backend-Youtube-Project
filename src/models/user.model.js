import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt, { hash } from "bcrypt";                            // encryption ke liye use hota h

const userSchema = new Schema(
    {
        username:{
            type: String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type: String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullname:{
            type: String,
            required:true,
            lowercase:true,
            trim:true,
        },
        avatar:{
            type: String, // cloudinary url use krenge
            required:true,
        },
        coverImage:{
            type: String, // cloudinary url use krenge
        },
        watchHistory:[
            {
                type: Schema.Types.ObjectId,
                ref: "video" 
            }
        ],
        password:{
            type: String,
            required:[true, 'Password is required!']
        },
        refreshToken:{
            type:String
        }


    },
    {timestamps:true}
)
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 8 )      //bcrypt.hash takes 2 parameters, the item we wanna encrypt, and "rounds", also await is imp.
    next();
})                                                      //idhar we cant use ()=>{} arrow func, cause ispe this. ka reference nhi hota,   simply, userSchema ka context nahi milega if we use arrow func. so use regular func. ALSO use async cause encryption takes some time.

userSchema.methods.isPasswordCorrect = async function (password){
   return await bcrypt.compare(password, this.password)             // bcrypt se password validation. jo bhi method call krega wo password bhejega  in form of string, bcrypt will compare it w this.password(legit one). returns Boolean
}

userSchema.methods.generateAcessToken = function (){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const user = mongoose.model("user", userSchema)