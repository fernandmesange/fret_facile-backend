import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import axios from 'axios';
import { ApiCode } from '../models/ApiCode.model.js';
import { Requests } from '../models/Request.model.js';
import { addBatchedMail } from './BatchedMail.controller.js';


export const getSecretKey = async (req, res) => {
    try {

      const currentCode = await ApiCode.findOne({type:'secret_key'});
        const post = req.body; // Récupérer les données envoyées dans le corps de la requête
        console.log('Code reçu :', post); // Afficher le code dans la console
        if(post){
          if(currentCode){
          await ApiCode.updateOne({ type:'secret_key'}, { code: post.secret_key });
          res.status(201).json({ message: 'Code recu avec succée', data: post });
          }else{
            await ApiCode.create({type:'secret_key', code:post.secret_key});
            res.status(201).json({ message: 'Code recu avec succée', data: post });
          }
        }
        
      } catch (error) {
        console.error('Erreur :', error);
        res.status(500).json({ message: 'Erreur lors de la réception du code' });
      }
};



export const getSecretKeyDev = async (req, res) => {
  try {

    const currentCode = await ApiCode.findOne({type:'dev_secret_key'});
      const post = req.body; // Récupérer les données envoyées dans le corps de la requête
      console.log('Code reçu :', post); // Afficher le code dans la console
      if(post){
        if(currentCode){
        await ApiCode.updateOne({ type:'dev_secret_key'}, { code: post.secret_key });
        res.status(201).json({ message: 'Code recu avec succée', data: post });
        }else{
          await ApiCode.create({type:'dev_secret_key', code:post.secret_key});
          res.status(201).json({ message: 'Code recu avec succée', data: post });
        }
      }
      
    } catch (error) {
      console.error('Erreur :', error);
      res.status(500).json({ message: 'Erreur lors de la réception du code test' });
    }
};



// Tâche cron pour appeler le renouvellement toutes les 50 minutes de la sk test
cron.schedule("*/55 * * * *", async () => {
  try{
    const response = axios.post(process.env.TEST_URL_RENEW_SECRET,{
      operationAccountCode: process.env.ACCOUNT_TEST,
      receptionUrlCode:process.env.RECUP_SECRET_KEY_URL_TEST,
      password:process.env.PASSWORD_RENEW_SECRET
    },
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    } );

    
    res.status(200).json({message: 'La clé DEV a été correctement générer', sk:response.data});
  
  }catch(err){
    res.status(500).json({message:'Une erreur est survenue pendant la recuperation de la clé DEV', error:err})
  }
}
);


// Tâche cron pour appeler le renouvellement toutes les 50 minutes
cron.schedule("*/55 * * * *", async () => {
  try{
    const response = axios.post(process.env.URL_RENEW_SECRET,{
      operationAccountCode: process.env.ACCOUNT_AM,
      receptionUrlCode:process.env.RECUP_SECRET_KEY_URL,
      password:process.env.PASSWORD_RENEW_SECRET
    },
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    } );

    
    res.status(200).json({message: 'La clé a été correctement générer', sk:response.data});
  
  }catch(err){
    res.status(500).json({message:'Une erreur est survenue pendant la recuperation de la clé', error:err})
  }
}
);


export const initiatePayment = async (req, res) => {
  const { phone_number } = req.body;
  const requestId = req.params.requestId;

  try {
    // Récupérer la requête
    const request = await Requests.findById(requestId);
    if (!request) return res.status(404).json({ error: 'Requête introuvable' });
    console.log(request.paymentReference);
    // Vérifier la clé secrète
    const sk = await ApiCode.findOne({ type: 'dev_secret_key' });
    console.log(sk)
    if (!sk) return res.status(500).json({ error: 'Clé secrète introuvable' });

    // Préparer les paramètres
    const payload = {
      agent: process.env.SLUG_MARCHAND,
      amount: 200, // Montant de la transaction
      reference: request.paymentReference, // Référence unique
      service: 'RESTFUL', // Type de service
      customer_account_number: phone_number, // Numéro de téléphone client
      merchant_operation_account_code: process.env.ACCOUNT_TEST, // Compte marchand
      transaction_type: 'PAYMENT', // Type de transaction
      owner_charge: 'MERCHANT', // Responsable des frais
      callback_url_code: process.env.CALLBACK_URL, // Callback
    };

    // Envoyer la requête à l'API PVit
    const response = await axios.post(`${process.env.TEST_URL_API_REST}`, payload, {
      headers: {
        'X-Secret': sk.code,
        'Content-Type': 'application/json',
      },
    });

    console.log('Réponse de l\'API PVit :', response.data);

    // Vérifier si le lien a été généré
    if (response.data) {
      return res.status(200).json(response.data);
    }

    return res.status(500).json({ error: 'Erreur lors de la génération du lien', data: response.data });
  } catch (error) {
    console.log(error);
    console.error('Erreur lors de l\'utilisation de RESTLINK :', error.response?.data || error.message);
    res.status(500).json({ error: 'Erreur interne', details: error.response?.data });
  }
};


export const transactionStatus = async (req, res) => {
  const { paymentReference } = req.query;

  if (!paymentReference ) {
    return res.status(400).json({ error: 'Paramètres manquants dans la requête.' });
  }

  try {
    const sk = await ApiCode.findOne({ type: 'dev_secret_key' });
    if (!sk) {
      return res.status(500).json({ error: 'Clé secrète introuvable.' });
    }

    console.log('Vérification du statut avec la clé secrète:', sk);

    const response = await axios.get(
      `${process.env.TEST_URL_API_CHECK_STATUS}`, // URL complète de l'API
      {
        params: {
          transactionId: paymentReference,
          accountOperationCode: process.env.ACCOUNT_TEST,
          transactionOperation: 'PAYMENT',
        },
        headers: {
          'X-Secret': sk.code,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Réponse de l\'API :', response.data);
    
        res.status(200).json({
          message: 'Statut récupéré avec succès.',
          status: response.data.status,
          data: response.data,
        });
    
        if(response.data.status === "SUCCESS" ){
          const request = await Requests.findOneAndUpdate({ paymentReference: paymentReference }, { status: 'WAITING_FOR_QUOTE' });
          await addBatchedMail({
            to: req.user.email,
            subject: `Confirmation de demande de ${request.productName}`,
            message: `Votre demande de ${request.productName} a été envoyée avec succès.`
          });
        }else{
          await Requests.updateOne({ paymentReference: paymentReference }, { status: 'UNPAID' });
        }
      } catch (error) {
        console.log(error);
        console.error('Erreur lors de la récupération du statut :', error.response?.data || error.message);
    
        res.status(500).json({
          error: 'Erreur interne lors de la récupération du statut.',
          details: error.response?.data || error.message,
        });
      }
  };


  export const paymentCallback = async (req, res) => {
    const { transactionId, status, code } = req.body; // Données envoyées par le callback
    try {
      console.log(`Callback reçu : Transaction ${transactionId} - Statut : ${status}`);
      res.status(200).json({
        responseCode: code || 200, // Utilisez un code par défaut si `code` n'est pas fourni
        transactionId: transactionId, // ID de la transaction reçu
      });
    } catch (error) {
      console.error('Erreur lors du traitement du callback :', error.message);
  
      // Réponse en cas d'erreur
      res.status(500).json({
        responseCode: 500,
        error: 'Erreur interne lors du traitement du callback.',
      });
    }
  };
  



