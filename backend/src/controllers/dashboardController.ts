
import { Request, Response } from 'express';
import InventoryItem from '../models/InventoryItem';
import Sale from '../models/Sale';
import Expense from '../models/Expense';

// @desc    Get dashboard statistics
// @route   GET /api/v1/dashboard
// @access  Private
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Parallel execution for aggregations
        const [
            salesStats,
            expenseStats,
            inventoryStats,
            lowStockItems,
            nearingExpiryItems
        ] = await Promise.all([
            // 1. Total Sales & COGS (Completed only)
            Sale.aggregate([
                { $match: { status: 'COMPLETED' } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$total" },
                        totalSubtotal: { $sum: "$subtotal" }
                    }
                }
            ]),

            // 2. Total Expenses
            Expense.aggregate([
                { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
            ]),

            // 3. Asset Value (Inventory Value)
            InventoryItem.aggregate([
                {
                    $project: {
                        value: { $multiply: ["$quantity", "$costPerUnit"] }
                    }
                },
                { $group: { _id: null, totalAssetValue: { $sum: "$value" } } }
            ]),

            // 4. Low Stock Items (Top 5)
            InventoryItem.find({
                $expr: { $lte: ["$quantity", "$minThreshold"] }
            }).limit(5),

            // 5. Nearing Expiry (Next 3 months, Top 5)
            InventoryItem.find({
                expiryDate: {
                    $ne: null,
                    $lte: new Date(new Date().setMonth(new Date().getMonth() + 3))
                }
            }).sort({ expiryDate: 1 }).limit(5)
        ]);

        const revenue = salesStats[0]?.totalRevenue || 0;
        // Assuming COGS is approx 40% of subtotal based on previous frontend logic
        // logic was: totalCOGS = sales.reduce((sum, s) => sum + (s.subtotal * 0.4), 0);
        const cogs = (salesStats[0]?.totalSubtotal || 0) * 0.4;
        const expenses = expenseStats[0]?.totalExpenses || 0;
        const netProfit = revenue - cogs - expenses;
        const assetValue = inventoryStats[0]?.totalAssetValue || 0;

        res.json({
            revenue,
            netProfit,
            expenses,
            assetValue,
            lowStock: lowStockItems,
            nearingExpiry: nearingExpiryItems
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
