import express from 'express';
import {  checkStatus, login, logout, register, verificationToken } from '../controllers/Users.controller.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { verifyToken } from './../middlewares/verifyToken.js';
import { getArticle, publishArticle, getPublicArticles, getAllArticles } from '../controllers/Article.controller.js';



const router = express.Router();

// router.get('/', getUsers);

router.get('/', getPublicArticles);
router.get('/admin', verifyToken, getAllArticles);
router.post('/publish', verifyToken, upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'secondaryImage', maxCount: 1 },
]), publishArticle);
router.get('/:slug', getArticle);



export default router;