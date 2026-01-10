import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getSettings)
    .put(protect, updateSettings);

export default router;
