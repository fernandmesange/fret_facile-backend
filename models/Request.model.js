import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    productName: {
        type: String,
        required: true,
    },
    paymentReference: {
        type: String,
        required: true,
    },
    productSector: {
        type: String,
        required: true,
    },
    productQuantity: {
        type: Number,
        required: true,
    },
    productDescription: {
        type: String,
        required: true,
    },
    deadline:{
        type:Date,
        required:true,
    },
    status:{
        type:String,
        enum: [
            'WAITING_FOR_PAYMENT',
            'UNPAID',
            'WAITING_FOR_QUOTE',
            'ADMIN_VALIDATION',
            'CLIENT_VALIDATION',
            'ORDER_IN_PROGRESS',
            'DEFERRED',
          ],
        default: 'WAITING_FOR_PAYMENT',
    },
    clientBudget: {
        type: Number,
        required: true,
    },
    productPictures:{
        type:[String],
        required:true
    },
    productLink:{
        type:String,
    },

},{timestamps:true});

export const Requests = mongoose.model('Request', RequestSchema);