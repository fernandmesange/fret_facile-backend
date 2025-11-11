import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { upload } from './../middlewares/uploadMiddleware.js';
import fs from 'fs';
import { User, Forwarder, Admin, ClientUser } from '../models/Users.model.js';
import { Requests } from '../models/Request.model.js';
import { Orders } from '../models/Order.model.js';
import { Quotes } from '../models/Quote.model.js';

dotenv.config();


export const getUserStats = async (req, res) => {
    try{
        console.log(req.user);
        const id = req.user.id;
        const user = await User.findById(id);
        const requests = await Requests.find({ clientId:id });
        
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }

        
        const requestIds = requests.map(request => request._id); // Extraire les IDs des requêtes
const receivedQuotes = await Quotes.find({
  requestId: { $in: requestIds },
  status: { $in: ['CLIENT_VALIDATION'] }
});

      const orders = await Orders.find({ clientId: id });

        res.status(200).json({
            requests,
            receivedQuotes,
            orders
        });
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}



export const getForwarderStats = async (req, res) => {
    try{
        console.log(req.user);
        const id = req.user.id;
        const user = await Forwarder.findById(id);


        
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }

        const allQuotes = await Quotes.find({ forwarderId: id}).populate({
            path: 'requestId',
            model: 'Request', 
        });
        const waitingQuotes = allQuotes.filter(quote => quote.requestId.status === 'ADMIN_VALIDATION' || quote.status === 'CLIENT_VALIDATION');
        const acceptedQuotes = allQuotes.filter(quote => quote.requestId.status === 'ORDER_IN_PROGRESS');
        const orders = await Orders.find({ forwarderId: id });
       
        res.status(200).json({
            waitingQuotes,
            acceptedQuotes,
            orders
        });

        
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}





export const getStatsForAdmin = async (req, res) => {
    try{
        console.log(req.user);
        const id = req.user.id;


        const user = await Admin.findById(id);

        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }



        const allQuotes = await Quotes.find().populate({
            path: 'requestId',
            model: 'Request', 
        }).populate({
            path: 'forwarderId',
            model: 'User',
        });

        

        const allQuotesLength = allQuotes.length;

        const waitingQuotes = allQuotes.filter(quote => quote.requestId?.status === "ADMIN_VALIDATION");
        const allForwardersLength = await Forwarder.countDocuments();
        const allRequestsLength = await Requests.countDocuments();
        const allClientsLength = await ClientUser.countDocuments();
        const allOrdersLength = await Orders.countDocuments();



        const  waitingQuotesLength = waitingQuotes.length;

       
        res.status(200).json({
            allQuotesLength,
            waitingQuotesLength,
            allForwardersLength,
            allRequestsLength,
            allClientsLength,
            allOrdersLength
        });

        
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}



