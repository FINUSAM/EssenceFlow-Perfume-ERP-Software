import express from 'express';
import {
    getVendors,
    createVendor,
    updateVendor,
    deleteVendor,
} from '../controllers/vendorController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getVendors)
    .post(protect, createVendor);

router.route('/:id')
    .patch(protect, updateVendor)
    .delete(protect, deleteVendor);

export default router;
