import { Request, Response } from 'express';
import User from '../models/User';
import InventoryItem from '../models/InventoryItem';
import Product from '../models/Product';
import Sale from '../models/Sale';
import Vendor from '../models/Vendor';
import Customer from '../models/Customer';
import Expense from '../models/Expense';
import Purchase from '../models/Purchase';
import Wastage from '../models/Wastage';
import BusinessSettings from '../models/BusinessSettings';

// @desc    Get full backup of database
// @route   GET /api/v1/backup
// @access  Private (Admin)
export const getBackup = async (req: Request, res: Response) => {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            users: await User.find({}),
            inventory: await InventoryItem.find({}),
            products: await Product.find({}),
            sales: await Sale.find({}),
            vendors: await Vendor.find({}),
            customers: await Customer.find({}),
            expenses: await Expense.find({}),
            purchases: await Purchase.find({}),
            wastage: await Wastage.find({}),
            settings: await BusinessSettings.find({}),
        };

        res.json(backup);
    } catch (error) {
        console.error("Backup Error:", error);
        res.status(500).json({ message: 'Backup creation failed' });
    }
};

// @desc    Restore database from backup
// @route   POST /api/v1/backup
// @access  Private (Admin)
export const restoreBackup = async (req: Request, res: Response) => {
    try {
        const data = req.body;

        if (!data || !data.timestamp) {
            res.status(400).json({ message: 'Invalid backup file' });
            return;
        }

        // Optional: clear existing data? Or upsert?
        // A full restore usually implies clearing old data to match the backup state or merging.
        // For safety/simplicity in this ERP context, let's Upsert based on ID if present, otherwise create.
        // Actually, simple restore usually wipes current state OR just inserts missing.
        // Let's go with "Wipe and Replace" for a "Restore" action, but that's dangerous.
        // Let's do "Smart Upsert" - if ID exists, update, else insert.

        // Helper to bulk upsert
        const bulkOps = (Model: any, items: any[]) => {
            if (!items || !Array.isArray(items)) return Promise.resolve();
            const ops = items.map(item => ({
                updateOne: {
                    filter: { _id: item._id },
                    update: { $set: item },
                    upsert: true
                }
            }));
            if (ops.length > 0) return Model.bulkWrite(ops);
            return Promise.resolve();
        };

        await Promise.all([
            bulkOps(User, data.users),
            bulkOps(InventoryItem, data.inventory),
            bulkOps(Product, data.products),
            bulkOps(Sale, data.sales),
            bulkOps(Vendor, data.vendors),
            bulkOps(Customer, data.customers),
            bulkOps(Expense, data.expenses),
            bulkOps(Purchase, data.purchases),
            bulkOps(Wastage, data.wastage),
            bulkOps(BusinessSettings, data.settings),
        ]);

        res.json({ message: 'Restore completed successfully' });
    } catch (error) {
        console.error("Restore Error:", error);
        res.status(500).json({ message: 'Restore failed' });
    }
};
