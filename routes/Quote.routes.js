import express from 'express';
import { verifyToken } from './../middlewares/verifyToken.js';
import { acceptQuote, changeQuoteStatus, getAllQuotes, getClientQuotes, getForwarderQuotes, sendQuote} from './../controllers/Quote.controller.js';
import { upload } from './../middlewares/uploadMiddleware.js';


const router = express.Router();


router.post('/send', verifyToken, upload.array('productPictures',5) ,sendQuote);
router.get('/', verifyToken, getClientQuotes);
router.get('/admin', verifyToken, getAllQuotes);
router.get('/forwarder', verifyToken, getForwarderQuotes);
router.post('/accept/:quoteId', verifyToken, acceptQuote);
router.put('/change/:quoteId', verifyToken, changeQuoteStatus);

export default router;