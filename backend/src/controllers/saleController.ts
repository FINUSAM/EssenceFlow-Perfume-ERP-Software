import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sale from '../models/Sale';
import Product from '../models/Product';
import Customer from '../models/Customer';

// @desc    Get all sales
// @route   GET /api/v1/sales
// @access  Private
export const getSales = async (req: Request, res: Response) => {
    try {
        const sales = await Sale.find({})
            .populate('items.productId', 'name sku')
            .populate('customerId', 'name');
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new sale (Deduct Stock)
// @route   POST /api/v1/sales
// @access  Private
export const createSale = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { receiptNumber, customerId, items, subtotal, discount, total } = req.body;

        // 1. Validate Stock & Deduct
        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) throw new Error(`Product ${item.productId} not found`);

            if (product.currentStock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${product.currentStock}`);
            }

            product.currentStock -= item.quantity;
            await product.save({ session });
        }

        // 2. Create Sale Record
        const sale = new Sale({
            receiptNumber,
            customerId,
            items,
            subtotal,
            discount,
            total,
        });
        const createdSale = await sale.save({ session });

        // 3. Update Customer Spend (if attached)
        if (customerId) {
            const customer = await Customer.findById(customerId).session(session);
            if (customer) {
                customer.totalSpent += total;
                await customer.save({ session });
            }
        }

        await session.commitTransaction();
        res.status(201).json(createdSale);

    } catch (error: any) {
        await session.abortTransaction();
        res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
};

// @desc    Void (Delete) a sale and restore stock
// @route   DELETE /api/v1/sales/:id
// @access  Private
export const voidSale = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const sale = await Sale.findById(req.params.id).session(session);
        if (!sale) throw new Error('Sale not found');

        if (sale.status === 'VOIDED') throw new Error('Sale already voided');

        // Restore Stock
        for (const item of sale.items) {
            const product = await Product.findById(item.productId).session(session);
            if (product) {
                product.currentStock += item.quantity;
                await product.save({ session });
            }
        }

        // Revert Customer Spend
        if (sale.customerId) {
            const customer = await Customer.findById(sale.customerId).session(session);
            if (customer) {
                customer.totalSpent -= sale.total;
                await customer.save({ session });
            }
        }

        sale.status = 'VOIDED';
        await sale.save({ session });

        await session.commitTransaction();
        res.json({ message: 'Sale voided successfully' });

    } catch (error: any) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
};
