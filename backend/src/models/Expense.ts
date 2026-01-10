import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        default: 0,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
}, {
    timestamps: true,
});

export interface IExpense extends mongoose.Document {
    category: string;
    description: string;
    amount: number;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const Expense = mongoose.model<IExpense>('Expense', expenseSchema);

export default Expense;
