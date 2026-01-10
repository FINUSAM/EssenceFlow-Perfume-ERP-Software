import express from 'express';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getExpenses)
    .post(protect, createExpense);

router.route('/:id')
    .patch(protect, updateExpense)
    .delete(protect, deleteExpense);

export default router;
