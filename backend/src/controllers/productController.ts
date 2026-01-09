import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import InventoryItem from '../models/InventoryItem';

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Private
export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await Product.find({})
            .populate('ingredients.inventoryItemId', 'name costPerUnit')
            .populate('packaging.inventoryItemId', 'name costPerUnit');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new product formulation
// @route   POST /api/v1/products
// @access  Private
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { sku, name, ingredients, packaging, sellingPrice, totalCost, currentStock } = req.body;

        const product = new Product({
            sku,
            name,
            ingredients,
            packaging,
            sellingPrice,
            totalCost,
            currentStock: currentStock || 0,
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Invalid data' });
    }
};

// @desc    Update a product
// @route   PATCH /api/v1/products/:id
// @access  Private
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = req.body.name || product.name;
            product.sku = req.body.sku || product.sku;
            product.ingredients = req.body.ingredients || product.ingredients;
            product.packaging = req.body.packaging || product.packaging;
            product.sellingPrice = req.body.sellingPrice !== undefined ? req.body.sellingPrice : product.sellingPrice;
            product.totalCost = req.body.totalCost !== undefined ? req.body.totalCost : product.totalCost;

            // Stock adjustment is usually done via produce/adjust, but allowing manual override
            if (req.body.currentStock !== undefined) product.currentStock = req.body.currentStock;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
};

// @desc    Produce a batch of products (deduct raw materials)
// @route   POST /api/v1/products/:id/produce
// @access  Private
export const produceBatch = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { quantity } = req.body; // Quantity to produce
        if (!quantity || quantity <= 0) {
            throw new Error('Invalid quantity');
        }

        const product = await Product.findById(req.params.id).session(session);
        if (!product) {
            throw new Error('Product not found');
        }

        // Deduct Ingredients
        for (const ing of product.ingredients) {
            const inventoryItem = await InventoryItem.findById(ing.inventoryItemId).session(session);
            if (!inventoryItem) throw new Error(`Ingredient ${ing.inventoryItemId} not found`);

            const needed = ing.amount * quantity;
            if (inventoryItem.quantity < needed) {
                throw new Error(`Insufficient stock for ${inventoryItem.name}. Needed: ${needed}, Available: ${inventoryItem.quantity}`);
            }

            inventoryItem.quantity -= needed;
            await inventoryItem.save({ session });
        }

        // Deduct Packaging
        for (const pkg of product.packaging) {
            const inventoryItem = await InventoryItem.findById(pkg.inventoryItemId).session(session);
            if (!inventoryItem) throw new Error(`Packaging ${pkg.inventoryItemId} not found`);

            const needed = pkg.amount * quantity;
            if (inventoryItem.quantity < needed) {
                throw new Error(`Insufficient stock for ${inventoryItem.name}. Needed: ${needed}, Available: ${inventoryItem.quantity}`);
            }

            inventoryItem.quantity -= needed;
            await inventoryItem.save({ session });
        }

        // Increase Product Stock
        product.currentStock += Number(quantity);
        await product.save({ session });

        await session.commitTransaction();
        res.json({ message: 'Production successful', product });

    } catch (error: any) {
        await session.abortTransaction();
        res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
};

// @desc    Delete a product
// @route   DELETE /api/v1/products/:id
// @access  Private
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
