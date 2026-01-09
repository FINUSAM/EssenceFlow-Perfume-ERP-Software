import express from 'express';
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    produceBatch,
} from '../controllers/productController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getProducts)
    .post(protect, createProduct);

router.route('/:id')
    .patch(protect, updateProduct)
    .delete(protect, deleteProduct);

router.route('/:id/produce')
    .post(protect, produceBatch); // Special action

export default router;
