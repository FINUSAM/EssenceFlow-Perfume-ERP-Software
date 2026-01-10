import express from 'express';
import { getBackup, restoreBackup } from '../controllers/backupController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getBackup)
    .post(protect, restoreBackup);

export default router;
