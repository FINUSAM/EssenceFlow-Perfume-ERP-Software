import { Request, Response } from 'express';
import Purchase from '../models/Purchase';
import InventoryItem from '../models/InventoryItem';

// @desc    Get all purchases
// @route   GET /api/v1/purchases
// @access  Private
export const getPurchases = async (req: Request, res: Response) => {
    try {
        const purchases = await Purchase.find({})
            .populate('vendorId', 'name email')
            .populate('items.inventoryItemId', 'name category')
            .sort({ date: -1 });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new purchase (and update inventory)
// @route   POST /api/v1/purchases
// @access  Private
export const createPurchase = async (req: Request, res: Response) => {
    try {
        const { vendorId, items, totalAmount, date, referenceNumber } = req.body;

        const purchase = new Purchase({
            vendorId,
            items,
            totalAmount,
            date,
            referenceNumber,
        });

        const createdPurchase = await purchase.save();

        // Update Inventory Stock
        // For each item in the purchase, increment the corresponding inventory item's quantity
        // and optionally update costPerUnit (weighted average could be better, but simple replacement or manual is often used. 
        // Here we just update quantity for simplicity, or maybe update cost if provided).
        // Let's increment quantity.
        for (const pItem of items) {
            const invItem = await InventoryItem.findById(pItem.inventoryItemId);
            if (invItem) {
                invItem.quantity = (invItem.quantity || 0) + Number(pItem.quantity);
                // Optional: Update cost per unit to the latest purchase price?
                // invItem.costPerUnit = pItem.costPerUnit; 
                await invItem.save();
            }
        }

        res.status(201).json(createdPurchase);
    } catch (error: any) {
        console.error("Create Purchase Error:", error);
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};

// @desc    Delete a purchase (Reverse inventory effect?)
// @route   DELETE /api/v1/purchases/:id
// @access  Private
export const deletePurchase = async (req: Request, res: Response) => {
    try {
        const purchase = await Purchase.findById(req.params.id);

        if (purchase) {
            // Reverse Inventory Stock
            for (const pItem of purchase.items) {
                const invItem = await InventoryItem.findById(pItem.inventoryItemId);
                if (invItem) {
                    invItem.quantity = Math.max(0, (invItem.quantity || 0) - Number(pItem.quantity));
                    await invItem.save();
                }
            }

            await purchase.deleteOne();
            res.json({ message: 'Purchase removed' });
        } else {
            res.status(404).json({ message: 'Purchase not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Update a purchase
// @route   PATCH /api/v1/purchases/:id
// @access  Private
export const updatePurchase = async (req: Request, res: Response) => {
    try {
        const purchase = await Purchase.findById(req.params.id);

        if (purchase) {
            // 1. Revert Inventory Stock (Deduct old items)
            for (const pItem of purchase.items) {
                const invItem = await InventoryItem.findById(pItem.inventoryItemId);
                if (invItem) {
                    invItem.quantity = Math.max(0, (invItem.quantity || 0) - Number(pItem.quantity));
                    await invItem.save();
                }
            }

            // 2. Update Purchase Fields
            purchase.vendorId = req.body.vendorId || purchase.vendorId;
            purchase.items = req.body.items || purchase.items;
            purchase.totalAmount = req.body.totalAmount || purchase.totalAmount;
            purchase.date = req.body.date || purchase.date;
            purchase.referenceNumber = req.body.referenceNumber || purchase.referenceNumber;

            // 3. Apply New Inventory Stock (Add new items)
            for (const pItem of purchase.items) {
                const invItem = await InventoryItem.findById(pItem.inventoryItemId);
                if (invItem) {
                    invItem.quantity = (invItem.quantity || 0) + Number(pItem.quantity);
                    await invItem.save();
                }
            }

            const updatedPurchase = await purchase.save();
            res.json(updatedPurchase);
        } else {
            res.status(404).json({ message: 'Purchase not found' });
        }
    } catch (error: any) {
        console.error("Update Purchase Error:", error);
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};
