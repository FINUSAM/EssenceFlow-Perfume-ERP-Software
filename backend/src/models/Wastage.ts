import mongoose from 'mongoose';

const wastageSchema = new mongoose.Schema({
    inventoryItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    cost: {
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

export interface IWastage extends mongoose.Document {
    inventoryItemId: mongoose.Types.ObjectId;
    amount: number;
    reason: string;
    cost: number;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const Wastage = mongoose.model<IWastage>('Wastage', wastageSchema);

export default Wastage;
