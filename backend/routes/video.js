import express from 'express';
import { generateToken } from '../modules/video/controllers/VideoController.js';

const router = express.Router();

router.post('/token', generateToken);

export default router;