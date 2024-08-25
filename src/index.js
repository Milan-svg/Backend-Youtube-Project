import {} from 'dotenv/config'
// import dotenv from "dotenv"
import connectDB from './db/index.js'

// dotenv.config({path: "./.env"})

connectDB() // kyuki ye async method hai, itll obv return a promise.
.then(()=>{
    app.on("error", (error)=>{
        console.log("ERROR:", error)
        throw error
    });
    app.listen(process.env.PORT || 3000, ()=>{
        console.log(`Server running at port: ${process.env.PORT}`)
    });
})
.catch((error)=>{
    console.log("MONGODB CONNECTION FAILED", error)
})












// dev script, nodemon ke baad -r dotenv/config --experimental-json-modules 


/*
import express from 'express'
const app = express()
(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("ERROR:", error);
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`app is listening on port: ${process.env.PORT}`)
        })
    } catch (error) {
        console.log("ERROR:", error)
        throw error
    }
})()*/
