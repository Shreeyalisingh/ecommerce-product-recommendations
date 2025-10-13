import mongoose from "mongoose";
import "dotenv/config";

const connectionString= process.env.MONGODB ;

const db=async()=>{
    await mongoose.connect(connectionString);
}

export default db;
