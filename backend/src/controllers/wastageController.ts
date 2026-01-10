import { Request, Response } from 'express';
import Wastage from '../models/Wastage';
import InventoryItem from '../models/InventoryItem';

// @desc    Get all wastage records
// @route   GET /api/v1/wastage
// @access  Private
export const getWastage = async (req: Request, res: Response) => {
    try {
        const wastage = await Wastage.find({})
            .populate('inventoryItemId', 'name category costPerUnit')
            .sort({ date: -1 });
        res.json(wastage);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Report wastage (and reduce inventory)
// @route   POST /api/v1/wastage
// @access  Private
export const logWastage = async (req: Request, res: Response) => {
    try {
        const { inventoryItemId, amount, reason, date } = req.body;

        // Fetch item to get current cost and check stock
        const invItem = await InventoryItem.findById(inventoryItemId);
        if (!invItem) {
            res.status(404).json({ message: 'Inventory item not found' });
            return;
        }

        // Calculate cost of wastage based on inventory cost per unit
        const cost = (invItem.costPerUnit || 0) * amount;

        const wastage = new Wastage({
            inventoryItemId,
            amount,
            reason,
            cost,
            date,
        });

        // Reduce Inventory
        invItem.quantity = Math.max(0, (invItem.quantity || 0) - amount);
        await invItem.save();

        const createdWastage = await wastage.save();
        res.status(201).json(createdWastage);
    } catch (error: any) {
        console.error("Log Wastage Error:", error);
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};

// @desc    Delete wastage record (Reverse inventory reduction?)
// @route   DELETE /api/v1/wastage/:id
// @access  Private
export const deleteWastage = async (req: Request, res: Response) => {
    try {
        const wastage = await Wastage.findById(req.params.id);

        if (wastage) {
            // Restore Inventory Stock?
            // Usually if you delete a wastage record, it means it was a mistake, so yes, give the stock back.
            const invItem = await InventoryItem.findById(wastage.inventoryItemId);
            if (invItem) {
                invItem.quantity = (invItem.quantity || 0) + wastage.amount;
                await invItem.save();
            }

            await wastage.deleteOne();
            res.json({ message: 'Wastage record removed' });
        } else {
            res.status(404).json({ message: 'Wastage record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
