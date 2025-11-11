import mongoose from "mongoose";


const ArticleSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        unique:true,
    },
    description:{
        type:String,
        required:true,
    },
    content:{
        type:Object,
        required:true,
    },
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    categories:{
        type:String,
        required:true,
    },
    views:{
        type:Number,
        default:0,
    },
    mainImage:{
        type:String,
        required:true,
    },
    secondaryImages:{
        type:String,
        required:true,
    },
    status:{
        type:String,
        default:'DRAFT',
        enum:['DRAFT','PUBLISHED','ARCHIVED']
    },
    slug:{
        type:String,
        unique:true,
        required:true,
    }
},{timestamps:true});

export const Articles = mongoose.model('Articles',ArticleSchema);

