
import { BatchedMail } from "../models/BatchedMail.model.js";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { body } from "express-validator";
import nodemailerTransport from '../config/nodeMailerTransport.js';
import crypto from 'crypto';
import cron from 'node-cron';

dotenv.config();

export const addBatchedMail = async ({to, message, subject}) => {
  console.log(to, subject, message)
    try{
        const newBatchedMail = new BatchedMail({to, body:message, subject});
        await newBatchedMail.save();
        return newBatchedMail;
    }catch(error){
        console.log(error);
        
    }
}

async function processEmailBatch(){
  const BATCH_SIZE = 10;
  try{

    const unsentEmails = await BatchedMail.find({ sent: false }).limit(BATCH_SIZE);
    if(unsentEmails.length === 0){
      console.log('No emails to send');
      return;
    }
    const promises = unsentEmails.map(async (email) => {
      if(email.attempts > 3){
        console.log(`Email ${email._id} has reached the maximum number of attempts. Skipping.`);
        await BatchedMail.deleteOne({ _id: email._id });
        return;
      }
      try{

        console.log('Sending email:', email.to, email.subject, email.body);
        
        const emailOptions = {
          from: process.env.EMAIL_FROM,
          to: email.to,
          subject: email.subject,
          text: email.body,
        };
      
        await nodemailerTransport.sendMail(emailOptions);

      email.sent = true;
      await email.save();
      console.log(`Email to ${email.to} sent successfully`);
    }catch(sendError){
      email.attempts = (email.attempts || 0) + 1;
      await email.save();
      console.error('Error sending email:', sendError);
    }
  });
  await Promise.all(promises);

  }catch(error){
    console.log(error);
  }
}

cron.schedule('*/15 * * * *', () => {
  console.log('Execution du batch email', new Date().toISOString());
  processEmailBatch();
}) 
