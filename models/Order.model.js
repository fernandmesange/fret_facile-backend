import e from "express";
import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    quoteId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Quote',
    },
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Request',
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },

    forwarderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Forwarder',
    },

    orderDate:{
        type:Date,
        required:true,
    },
    trackingReference:{
        type:String,
        required:true,
    },
    deliveryDate:{
        type:Date,
        required:true,
    },
    status:{
        type:String,
        default:'PROGRESS',
        enum:['PROGRESS','PRODUCTION', 'TRANSIT', 'DELIVERY', 'AVAILABLE','CANCELLED'],
    },
    statusHistory:{
        type:[{String}],
        default:[{
            status:'PROGRESS',
            date:new Date(),
        }],
    },
    cancelReason:{
        type:String,
        default:'',
    }

},{timestamps:true});

export const Orders = mongoose.model('Orders', OrderSchema);