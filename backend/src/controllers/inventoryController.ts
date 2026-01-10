import { Request, Response } from 'express';
import InventoryItem from '../models/InventoryItem';

// @desc    Get all inventory items
// @route   GET /api/v1/inventory
// @access  Private
export const getInventory = async (req: Request, res: Response) => {
    try {
        const items = await InventoryItem.find({});
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new inventory item
// @route   POST /api/v1/inventory
// @access  Private
export const createInventoryItem = async (req: Request, res: Response) => {
    try {
        const { name, category, quantity, costPerUnit, minThreshold, batchNumber, expiryDate, vendorId } = req.body;

        const inventoryData: any = {
            name,
            category,
            quantity,
            costPerUnit,
            minThreshold,
            batchNumber,
        };

        // Handle optional fields that might be sent as empty strings
        if (expiryDate && expiryDate !== '') {
            inventoryData.expiryDate = expiryDate;
        }

        if (vendorId && vendorId !== '') {
            // Only add if it looks like a valid ObjectId (hex string of length 24) to avoid CastError
            if (/^[0-9a-fA-F]{24}$/.test(vendorId)) {
                inventoryData.vendorId = vendorId;
            }
        }

        const item = new InventoryItem(inventoryData);

        const createdItem = await item.save();
        res.status(201).json(createdItem);
    } catch (error: any) {
        console.error("Create Inventory Error:", error);
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};

// @desc    Update an inventory item
// @route   PATCH /api/v1/inventory/:id
// @access  Private
export const updateInventoryItem = async (req: Request, res: Response) => {
    try {
        const item = await InventoryItem.findById(req.params.id);

        if (item) {
            item.name = req.body.name || item.name;
            item.category = req.body.category || item.category;
            item.quantity = req.body.quantity !== undefined ? req.body.quantity : item.quantity; // Allow 0
            item.costPerUnit = req.body.costPerUnit !== undefined ? req.body.costPerUnit : item.costPerUnit;
            item.minThreshold = req.body.minThreshold !== undefined ? req.body.minThreshold : item.minThreshold;
            item.batchNumber = req.body.batchNumber || item.batchNumber;
            item.expiryDate = req.body.expiryDate || item.expiryDate;
            item.vendorId = req.body.vendorId || item.vendorId;

            const updatedItem = await item.save();
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
};

// @desc    Delete an inventory item
// @route   DELETE /api/v1/inventory/:id
// @access  Private
export const deleteInventoryItem = async (req: Request, res: Response) => {
    try {
        const item = await InventoryItem.findById(req.params.id);

        if (item) {
            // TODO: Check if item is used in any Product (Recipe) before deleting
            await item.deleteOne();
            res.json({ message: 'Item removed' });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
