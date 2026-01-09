import express from 'express';
import { authUser, registerUser } from '../controllers/authController';

const router = express.Router();

router.post('/login', authUser);
router.post('/register', registerUser); // Keep for setup

export default router;
