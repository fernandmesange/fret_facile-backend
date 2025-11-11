import mongoose from "mongoose";


const NotificationSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true,
    },
    message:{
        type:String,
        required:true,
    },

    type:{
        type:String,
        enum:['ORDER','QUOTE','REQUEST','OTHER'],
        required:true,
    }

},{timestamps:true});

export const Notification = mongoose.model('notification',NotificationSchema);

