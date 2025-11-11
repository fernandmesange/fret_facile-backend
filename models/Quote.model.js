import mongoose from "mongoose";

const QuoteSchema = new mongoose.Schema({
    requestId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'request',
        required:true,
    },
    forwarderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Forwarder',
    },
    productName:{
        type:String,
        required:true,
    },
    productQuantity:{
        type:Number,
        required:true
    },
    productDescription:{
        type:String,
        required:true,
    },
    productPicture:{
        type:[String],
        required:true,
    },
    dimension:{
        type:{
            length:Number,
            width:Number,
            height:Number,
            weight:Number,
        },
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    serviceFees:{
        type:Number,
        required:true,
    },
    totalPrice:{
        type:Number,
        required:true,
    },
    MOQ:{
        type:Number,
        required:true,
    },
    productionDelay:{
        type:Number,
        required:true,
    },
    deliveryToForwarderDelay:{
        type:Number,
        required:true
    },

    deliveryDelay:{
        type:Number,
        required:true,
    },
    deliveryType:{
        type:String,
        required:true,
    },
    dateSubmitted:{
        type:Date,
        default:Date.now,
    },

},{timestamps:true});

export const Quotes = mongoose.model('Quotes', QuoteSchema);