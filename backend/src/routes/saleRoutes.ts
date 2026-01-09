import express from 'express';
import {
    getSales,
    createSale,
    voidSale,
} from '../controllers/saleController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getSales)
    .post(protect, createSale);

router.route('/:id/void')
    .post(protect, voidSale); // Using post for action (or could be delete on /id)

router.route('/:id')
    .delete(protect, voidSale); // Alias delete to void for REST compliance

export default router;
