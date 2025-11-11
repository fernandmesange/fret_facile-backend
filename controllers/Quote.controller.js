import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { upload } from './../middlewares/uploadMiddleware.js';
import fs from 'fs';
import { Quotes } from './../models/Quote.model.js';
import { Requests } from './../models/Request.model.js';
import { Orders } from './../models/Order.model.js';
import crypto from 'crypto';
import { Notification } from '../models/Notification.model.js';
import nodemailerTransport from '../config/nodeMailerTransport.js';
import { User , Forwarder, Admin} from '../models/Users.model.js';
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


export const getAllQuotes = async (req, res) => {
    try{
        console.log(req.user);
        const id = req.user.id;
        const admin = await Admin.findById(id);

        if(!admin){
            return res.status(404).json({ message: 'Admin not found' });
        }

        const quotes = await Quotes.find().populate({
                path: 'requestId',
                model: 'Request'
        });
        res.status(200).json(quotes);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }

}



export const getClientQuotes = async (req, res) => {
    try{
        const id = req.user.id;
        const user = await User.findById(id);

        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }

        const requests = await Requests.find({clientId: id,status: { $in: ['CLIENT_VALIDATION', 'ORDER_IN_PROGRESS', 'DEFFERRED'] }})

        if(!requests || requests.length === 0){
            return res.status(200).json({ message: 'Ancun devis reçus' , quotes: [] });
        }

        const clientQuotes = [];

        for (const request of requests) {
            const quotes = await Quotes.find({ requestId: request._id }).populate({
                path: 'requestId',
                model: 'Request'
            });
            clientQuotes.push(...quotes);
        }
            
        res.status(200).json({quotes:clientQuotes});
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}

export const getForwarderQuotes = async (req, res) => {
    try {
        console.log(req.user);

        // Récupérer l'ID de l'utilisateur connecté
        const forwarderId = req.user.id;

        // Vérifier si le transitaire existe
        const forwarder = await Forwarder.findById(forwarderId);
        if (!forwarder) {
            return res.status(404).json({ message: 'Forwarder not found' });
        }

        // Récupérer les devis du transitaire et peupler `requestId`
        const quotes = await Quotes.find({ forwarderId }).populate({
            path: 'requestId',
            model: 'Request', // Assurez-vous que ce modèle est enregistré
        });

        // Filtrer les devis en fonction du statut de la requête
        

        // Retourner les devis filtrés
        res.status(200).json(quotes);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};

export const acceptQuote = async (req, res) => {
    try{
        const { quoteId } = req.params;
        console.log(quoteId);
        const quote = await Quotes.findById(quoteId);
        console.log(quote);
        const request = await Requests.findById(quote.requestId);
        const forwarder = await Forwarder.findById(quote.forwarderId);
        const client = await User.findById(request.clientId);

        if(!quote || !request || !forwarder || !client){
            return res.status(404).json({ message: 'Quote, request, forwarder or client not found' });
        }

        if(request.status !== 'CLIENT_VALIDATION'){
            return res.status(400).json({ message: 'Request cannot be accepted' });
        }

        request.status = 'ORDER_IN_PROGRESS';
        await request.save();
        const newOrder = await Orders.create({
            quoteId: quote._id,
            requestId: request._id,
            forwarderId: forwarder._id,
            clientId: client._id,
            orderDate: new Date(),
            trackingReference: generateRandomString(5),
            deliveryDate:  new Date() + quote.deliveryDelay,
        });

        res.status(200).json(newOrder);
    }

    catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}


export const changeQuoteStatus = async (req, res) => {
    try{
        const { quoteId } = req.params;
        const { status } = req.body;
        const { reason } = req.body;

        if(!quoteId || !status){
            return res.status(400).json({ message: 'Quote ID and status are required' });
        }


        console.log(status);
        console.log(quoteId);
        const quote = await Quotes.findById(quoteId);
        console.log(quote);
        const request = await Requests.findById(quote.requestId);
        const forwarder = await Forwarder.findById(quote.forwarderId);
        const client = await User.findById(request.clientId);

        if(!quote || !request || !forwarder || !client){
            return res.status(404).json({ message: 'Quote, request, forwarder or client not found' });
        }

        if(request.status !== 'ADMIN_VALIDATION'){
            return res.status(400).json({ message: 'Request Quote already validated' });
        }

        if(status === 'ACCEPTED'){
            request.status = 'CLIENT_VALIDATION';
            //Creer une notif et envoyer un mail au client et au transitaire
            sendNotification(`Votre devis pour la commande de ${request.productName} vient d'étre validé`, forwarder._id, 'QUOTE');
            sendNotification(`Vous avez reçu un devis pour la commande de ${request.productName} `, client._id, 'QUOTE');

            
            const clientMailOptions = {
                from: process.env.EMAIL_FROM,
                to: client.email,
                subject: `Devis pour la commande de ${request.productName}`,
                text: `Bonjour ${client.fullname}, vous avez reçu un devis pour la commande de ${request.productName} consulté le lien ci-dessous: ${process.env.FRONTEND_URL}/dashboard-client/my-quotes`,
            }
 

            const forwarderMailOptions = {
                from: process.env.EMAIL_FROM,
                to: forwarder.email,
                subject: `Devis pour la commande de ${request.productName}`,
                text: `Bonjour ${forwarder.fullname}, Votre devis pour la commande de ${request.productName} a été validé par les administrateurs , le client doit maintenant valider votre devis`,
            }

            try{

                await addBatchedMail({to:clientMailOptions.to, subject:clientMailOptions.subject, message:clientMailOptions.text});
                await addBatchedMail({ to:forwarderMailOptions.to, subject:forwarderMailOptions.subject, message:forwarderMailOptions.text});
            }catch(error){
                console.log(error);
            }

        }else if(status === 'REJECTED'){

            if(reason == ''){
                res.status(400).json({ message: 'Reason is required' });
            }else{
                //Creer une notif et envoyer un mail au client et au transitaire
                request.status = 'WAITING_FOR_QUOTE';
                request.reason = reason;

                sendNotification(`Votre devis pour la commande de ${request.productName} vient d'étre rejeté consulté votre dashboard pour en savoir plus`, forwarder._id, 'QUOTE');


                const forwarderMailOptions = {
                    from: process.env.EMAIL_FROM,
                    to: forwarder.email,
                    subject: `Devis pour la commande de ${request.productName}`,
                    text: `Bonjour ${forwarder.fullname}, Votre devis pour la commande de ${request.productName} a été refusé par les administrateurs pour la raison suivante: ${reason}`,
                }
    
                try{
                    await addBatchedMail({
                        to:forwarderMailOptions.to,
                        subject:forwarderMailOptions.subject,
                        message:forwarderMailOptions.text});
                }catch(error){
                    console.log(error);
                }
                
            }
        }
        await request.save();
        res.status(200).json('Quote status changed');
    }

    catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}




export const sendQuote = async (req,res) => {
    try{
        const {
            requestId,
            productName,
            productDescription,
            productQuantity,
            dimension,
            price,
            serviceFees,
            totalPrice,
            MOQ,
            productionDelay,
            deliveryToForwarderDelay,
            deliveryDelay,
            deliveryType,
        } = req.body;


        console.log(productName);
        if(!requestId || !productName || !productDescription || !productQuantity || !dimension || !price || !serviceFees ||!totalPrice || !MOQ || !productionDelay || !deliveryToForwarderDelay || !deliveryDelay || !deliveryType){
            return res.status(400).json({ message: 'All fields are required' });
        }

        const forwarderId = req.user.id;

        const request = await Requests.findById(requestId);
        if(!request){
            return res.status(400).json({ message: 'Request not found' });
        }

        if(request.status !== 'WAITING_FOR_QUOTE'){
            return res.status(400).json({ message: 'Request not in waiting for quote' });
        }



        if(!forwarderId){
            return res.status(400).json({ message: 'Forwarder not found' });
        }


        if(!req.files || req.files.length === 0){
            return res.status(400).json({ message: 'Au moins une image est requise.' });
        }

        const productPicturesFromForwarder = [];

        for (const file of req.files) {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: 'forwarder/quotes',
            });
            productPicturesFromForwarder.push(result.secure_url); // URL sécurisée de l'image
          }



        const forwarder = await Forwarder.findById(forwarderId);

        await Requests.findByIdAndUpdate(requestId, { status: 'ADMIN_VALIDATION' });

        const newQuote = await Quotes.create({
            requestId,
            forwarderId,
            productName,
            productDescription,
            productQuantity,
            dimension: JSON.parse(dimension),
            price,
            serviceFees,
            totalPrice,
            MOQ,
            productionDelay,
            deliveryToForwarderDelay,
            deliveryDelay,
            deliveryType,
            productPicture: productPicturesFromForwarder,
        });

        res.status(201).json(newQuote);
        
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}