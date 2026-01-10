import { Request, Response } from 'express';
import Expense from '../models/Expense';

// @desc    Get all expenses
// @route   GET /api/v1/expenses
// @access  Private
export const getExpenses = async (req: Request, res: Response) => {
    try {
        const expenses = await Expense.find({}).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new expense
// @route   POST /api/v1/expenses
// @access  Private
export const createExpense = async (req: Request, res: Response) => {
    try {
        const { category, description, amount, date } = req.body;

        const expense = new Expense({
            category,
            description,
            amount,
            date,
        });

        const createdExpense = await expense.save();
        res.status(201).json(createdExpense);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
};

// @desc    Update an expense
// @route   PATCH /api/v1/expenses/:id
// @access  Private
export const updateExpense = async (req: Request, res: Response) => {
    try {
        const { category, description, amount, date } = req.body;
        const expense = await Expense.findById(req.params.id);

        if (expense) {
            expense.category = category || expense.category;
            expense.description = description || expense.description;
            expense.amount = amount !== undefined ? amount : expense.amount;
            expense.date = date || expense.date;

            const updatedExpense = await expense.save();
            res.json(updatedExpense);
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
};

// @desc    Delete an expense
// @route   DELETE /api/v1/expenses/:id
// @access  Private
export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (expense) {
            await expense.deleteOne();
            res.json({ message: 'Expense removed' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
