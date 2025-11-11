import express from 'express';

import { upload } from '../middlewares/uploadMiddleware.js';
import { verifyToken } from './../middlewares/verifyToken.js';
import { getRequests, getRequestsForForwarder, getRequestsForUser, getSingleRequest, sendRequest } from '../controllers/Request.controller.js';

const router = express.Router();

// router.get('/', getUsers);
router.get('/forwarder',verifyToken, getRequestsForForwarder);
//router.get('/forwarder/:id',verifyToken, getRequestsForForwarder);
router.get('/user/:id',verifyToken, getRequestsForUser);
router.get('/',verifyToken, getRequests);
router.get('/:id',verifyToken, getSingleRequest);


router.post('/send',verifyToken,upload.array('productPictures', 5), sendRequest);


export default router;