import mongoose from 'mongoose';

const BatchedMailSchema = new mongoose.Schema({
    to:{
        type:String,
        required:true,
    },
    subject:{
        type:String,
        required:true,
    },
    body:{
        type:String,
        required:true,
    },
    sent:{
        type:Boolean,
        default:false,
    },
    attempts:{
        type:Number,
        default:0,
    }
},{timestamps:true});

export const BatchedMail = mongoose.model('BatchedMails',BatchedMailSchema);

