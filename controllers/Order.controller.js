
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { body } from "express-validator";
import cloudinary from './../middlewares/cloudinary.js';
import { Requests } from '../models/Request.model.js';
import crypto from 'crypto';
import { Orders } from '../models/Order.model.js';
import nodemailerTransport from "../config/nodeMailerTransport.js";
import { Notification } from "../models/Notification.model.js";
import { User , Forwarder, Admin} from '../models/Users.model.js';

dotenv.config();

function sendNotification(message, userId,type) {
    const notification = new Notification({
      message,
      userId,
      type
    });
    notification.save();
  }


  export const getAllOrders = async (req, res) => {
    try{
        const { id } = req.user;


        const orders = await Orders.find().populate({
            path: 'quoteId',
            model: 'Quotes',
        });
        res.status(200).json(orders);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}

export const getForwarderOrders = async (req, res) => {
    try{
        const { id } = req.user;
        const orders = await Orders.find({ forwarderId: id }).populate({
            path: 'quoteId',
            model: 'Quotes',
        });
        res.status(200).json(orders);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}


export const getClientOrders = async (req, res) => {
    try{
        const { id } = req.user;
        const orders = await Orders.find({ clientId: id }).populate({
            path: 'quoteId',
            model: 'Quotes',
        });
        res.status(200).json(orders);
    }catch(error){
        console.log(error);
        res.status(400).json({ error: error.message });
    }
}


export const updateStatus = async (req, res) => {
    try {
      const { orderId } = req.params;
  
      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required." });
      }
  
      if (!req.body.status && !req.body.cancelReason) {
        return res.status(400).json({ error: "Status or cancelReason is required." });
      }
  
      let order = await Orders.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }
  
      const user = await User.findById(order.clientId);
      if (!user || !user.email) {
        console.log("Client not found or email not found.");
        return res.status(404).json({ error: "Client or client email not found." });
      }

      const forwarder = await Forwarder.findById(order.forwarderId);
        
        if (!forwarder || !forwarder.email) {
        console.log("Forwarder not found or email not found.");
          return res.status(404).json({ error: "Forwarder or forwarder email not found." });
        }

      console.log(user.email);
  
      if (req.body.cancelReason) {
        order.status = "CANCELLED";
        order.cancelReason = req.body.cancelReason;
        await order.save();
  
        console.log(forwarder);
  
        const clientMailOptions = {
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: `Commande #${order.trackingReference} annulée`,
          text: `Votre commande a été annulée par le transitaire pour la raison suivante : ${req.body.cancelReason}`,
        };
  
        const forwarderMailOptions = {
          from: process.env.EMAIL_FROM,
          to: forwarder.email,
          subject: "Order Cancellation",
          text: `Vous avez annulé la commande #${order.trackingReference} du client ${user.fullname} pour la raison suivante : ${req.body.cancelReason}`,
        };

        try {
            await  nodemailerTransport.sendMail(clientMailOptions);
            sendNotification(`Votre commande #${order.trackingReference} a été annulée par le transitaire pour la raison suivante : ${req.body.cancelReason}`, user._id, 'ORDER');
          } catch (error) {
            console.error("Failed to send email to client 1:", error);
          }


          try {
            await nodemailerTransport.sendMail(forwarderMailOptions);
            sendNotification(`Vous avez annulé la commande #${order.trackingReference} du client ${user.fullname} pour la raison suivante : ${req.body.cancelReason}`, forwarder._id, 'ORDER');

          } catch (error) {
            console.error("Failed to send email to forwarder:", error);
          }
  
        return res.status(200).json("Order cancelled successfully");
      }
  
      order.status = req.body.status;
      await order.save();

      console.log(user.email);
      console.log(process.env.EMAIL_FROM);
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: `Commande #${order.trackingReference} mise à jour`,
        text: `Le statut de votre commande a été mis à jour : ${req.body.status}`,
      };


  
      try {
        await nodemailerTransport.sendMail(mailOptions);
        sendNotification(`Le statut de votre commande a été mis à jour : ${req.body.status}`, user._id, 'ORDER');
      } catch (error) {
        console.error("Failed to send email to client 2:", error);
      }
  
      res.status(200).json("Order updated successfully");
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  };
  