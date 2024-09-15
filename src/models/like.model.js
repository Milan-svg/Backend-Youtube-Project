import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema({
    comment:{
        type: Schema.Types.ObjectId,
        ref: "comment" 
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: "video"
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref: "tweet"
    },
     likedBy:{
        type: Schema.Types.ObjectId,
        ref: "user"
    }
},{timestamps:true})


export const like = mongoose.model("like" , likeSchema)