import mongoose from "mongoose";


const ApiCodeSchema = new mongoose.Schema({
    type:{
        type:String,
        required:true,
    },
    code:{
        type:String,
        required:true,
    },
},{timestamps:true});

export const ApiCode = mongoose.model('api_code',ApiCodeSchema);

