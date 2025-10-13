import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";
import db from "../database_connection/db.js";
import chats from "../routes/chat.routes.js";

const app=express();
const port = process.env.PORT || 8000;
app.use(cors({origin:"http://localhost:5173", credentials:true}));
app.use(express.urlencoded({ extended: true , limit: "50mb"}));
app.use(express.json({limit: "50mb"})); 

app.use("/api/chat",chats);

app.listen(port,()=>{
    try{
    db()
    .then(()=>{console.log("database connected")})
    .catch((e)=>{console.log(e)});
    console.log(`server started at ${port}`);
    }
    catch(e){
        console.log(e);
    }
})
