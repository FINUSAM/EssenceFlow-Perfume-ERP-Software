import express from 'express';
import {
    getInventory,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
} from '../controllers/inventoryController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getInventory)
    .post(protect, createInventoryItem);

router.route('/:id')
    .patch(protect, updateInventoryItem)
    .delete(protect, deleteInventoryItem);

export default router;
