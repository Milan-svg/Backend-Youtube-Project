import mongoose, {Schema} from "mongoose";

const tweetSchema = new Schema({
    owner:{
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    content:{
        type: String
    }
},{timestamps:true})

export const tweet = mongoose.model("tweet", tweetSchema)