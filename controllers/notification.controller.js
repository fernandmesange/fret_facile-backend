import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Orders } from '../models/Order.model.js';
import { Quotes } from '../models/Quote.model.js';
import { Notification } from '../models/Notification.model.js';
import { User, Forwarder,Admin } from '../models/Users.model.js';


dotenv.config();


export const getUserNotifications = async (req, res) => {
        console.log(req.user);
        const id = req.user.id;

        const user = await User.findById(id);

        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }

        try{
            const notifications = await Notification.find({ userId: id }).sort({ createdAt: -1 });
            res.status(200).json(notifications);
        }catch(error){
            console.log(error);
            res.status(400).json({ error: error.message });
        }
}


export const getForwarderNotifications = async (req, res) => {
    console.log(req.user);
    const id = req.user.id;

    const forwarder = await Forwarder.findById(id);

    if(!forwarder){
        return res.status(404).json({ message: 'Forwarder not found' });
    }

    try{
        const notifications = await Notification.find({ userId: id }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}



