import express from 'express';
import { verifyToken } from './../middlewares/verifyToken.js';
import { getAllOrders, getClientOrders, getForwarderOrders, updateStatus } from '../controllers/Order.controller.js';

const router = express.Router();

// router.get('/', getUsers);


router.get('/forwarder', verifyToken, getForwarderOrders);
router.get('/admin', verifyToken, getAllOrders);
router.get('/', verifyToken, getClientOrders);
router.put('/forwarder/:orderId', verifyToken, updateStatus);

export default router;