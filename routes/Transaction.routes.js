import express from 'express';
import { verifyToken } from './../middlewares/verifyToken.js';
import {getSecretKey, getSecretKeyDev, initiatePayment, paymentCallback, transactionStatus} from './../controllers/Transactions.controller.js';


const router = express.Router();


router.post('/payment-callback', paymentCallback);
router.post('/initiate-payment/request/:requestId', initiatePayment);
router.get('/transaction-status/',verifyToken, transactionStatus);
router.post('/getSecretKey', getSecretKey);
router.post('/getSecretKeyDev', getSecretKeyDev);
router.post('/getSecretKeyDev', getSecretKeyDev);
router.get('/payment-success', (req, res) => {
    res.redirect(`/success`);
  });
  
  router.get('/payment-failure', (req, res) => {
    res.redirect(`/failure`);
  });
  

export default router;