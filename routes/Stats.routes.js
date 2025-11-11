import express from 'express';
import { verifyToken } from './../middlewares/verifyToken.js';
import { getForwarderStats, getUserStats } from '../controllers/Stats.controller.js';
import { getStatsForAdmin } from './../controllers/Stats.controller.js';

const router = express.Router();

// router.get('/', getUsers);

router.get('/',verifyToken, getUserStats);
router.get('/forwarder',verifyToken, getForwarderStats);
router.get('/admin',verifyToken, getStatsForAdmin);


export default router;