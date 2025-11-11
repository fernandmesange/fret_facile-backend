import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { body } from "express-validator";
import cloudinary from './../middlewares/cloudinary.js';
import { Requests } from '../models/Request.model.js';
import crypto from 'crypto';
import { Notification } from '../models/Notification.model.js';
import nodemailerTransport from '../config/nodeMailerTransport.js';
import { addBatchedMail } from './BatchedMail.controller.js';


dotenv.config();

function sendNotification(message, userId,type) {
    const notification = new Notification({
      message,
      userId,
      type
    });
    notification.save();
  }


function generateRandomString(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = crypto.randomBytes(length);
    let result = "";
    for (let i = 0; i < bytes.length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }


export const sendRequest = async (req, res) => {
    console.log('tentative de création de demande');
    try{
        const {
            productName,
            productSector,
            productQuantity ,
            productDescription ,
            deadline ,
            clientBudget ,
            productLink 
        } = req.body;
        console.log(req.user);

        if(!productName ||  !productQuantity || !productSector || !productDescription || !deadline || !clientBudget){
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!req.files || req.files.length === 0) {
            
            return res.status(400).json({ message: 'Au moins une image est requise.' });
        }

        console.log(req.files.length);


        const productPicturesFromClient = [];

        for (const file of req.files) {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: 'client/requests',
            });
            productPicturesFromClient.push(result.secure_url); // URL sécurisée de l'image
          }
        

        const clientId = req.user.id;

        if(!clientId){
            return res.status(400).json({ message: 'Client not found' });
        }

        const newRequest = await Requests.create({ 
            clientId,
            productName,
            productSector,
            paymentReference: `REF${generateRandomString()}`,
            productQuantity,
            productDescription,
            productPictures: productPicturesFromClient,
            status: 'WAITING_FOR_PAYMENT',
            deadline,
            clientBudget,
            productLink 
        });


        sendNotification(`Votre demande de ${productName} a été envoyée avec succès.`, clientId,'REQUEST');

        res.status(200).json(newRequest);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}


export const getRequests = async (req, res) => {

    try{
        const requests = await Requests.find();
        console.log(requests)
        res.status(200).json(requests);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}


export const getSingleRequest = async (req, res) => {

    try{
        const { id } = req.params;
        const request = await Requests.findById(id);
        console.log(request)
        res.status(200).json(request);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}


export const getRequestsForUser = async (req, res) => {
    const { id } = req.user;
    try{
        console.log(id);
        const requests = await Requests.find({ clientId: id , status: { $nin: ['WAITING_FOR_PAYMENT', 'UNPAID'] } });
        console.log(requests)

        res.status(200).json(requests);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}

export const getRequestsForForwarder = async (req, res) => {
    try{
        const requests = await Requests.find({status: 'WAITING_FOR_QUOTE' });
        console.log(requests)

        res.status(200).json(requests);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}