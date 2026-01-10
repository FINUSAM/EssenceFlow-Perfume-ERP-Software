import express from 'express';
import { getWastage, logWastage, updateWastage, deleteWastage } from '../controllers/wastageController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getWastage)
    .post(protect, logWastage);

router.route('/:id')
    .patch(protect, updateWastage)
    .delete(protect, deleteWastage);

export default router;
