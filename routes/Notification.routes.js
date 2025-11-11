import express from 'express';
import { verifyToken } from './../middlewares/verifyToken.js';
import { getForwarderNotifications, getUserNotifications } from '../controllers/notification.controller.js';

const router = express.Router();

// router.get('/', getUsers);

router.get('/user/',verifyToken, getUserNotifications);
router.get('/forwarder/', verifyToken, getForwarderNotifications);

export default router;