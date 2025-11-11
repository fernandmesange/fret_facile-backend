import express from 'express';
import {  checkStatus, login, logout, register, resetPassword, signUpWithLink, updateInfo, updateUserWithLink, verificationToken, verifyTokenPassword } from '../controllers/Users.controller.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { verifyToken } from './../middlewares/verifyToken.js';
import { getClient, getUser, getUsers } from '../controllers/Client.controller.js';

const router = express.Router();

// router.get('/', getUsers);

router.get('/me', verifyToken, getUser);
router.get('/client/:id',verifyToken, getClient);
router.post('/register', upload.single('document') ,register);
router.post('/login', login);
router.post('/logout',logout);
router.get('/status',verifyToken, checkStatus);
router.put('/updateInfo', verifyToken, updateInfo);
router.get('/users', verifyToken, getUsers);
router.get('/verify', verificationToken);
router.post('/reset-password',resetPassword );
router.post('/change-password', verifyTokenPassword);

router.post('/create-user', verifyToken,signUpWithLink);
router.post('/update-new-user/:id',upload.single('document'), updateUserWithLink);


export default router;