import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema({
    comment:{
        type: String
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: "video"
    },
    likedBy:{
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref: "tweet"
    }
},{timestamps:true})


export const like = mongoose.model("like" , likeSchema)