import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        description: 'e.g., OIL, BOTTLE, BOX, CAP',
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
    },
    costPerUnit: {
        type: Number,
        required: true,
        default: 0,
    },
    minThreshold: {
        type: Number,
        required: true,
        default: 10,
    },
    batchNumber: {
        type: String,
    },
    expiryDate: {
        type: Date,
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: false,
    },
}, {
    timestamps: true,
});

export interface IInventoryItem extends mongoose.Document {
    name: string;
    category: string;
    quantity: number;
    costPerUnit: number;
    minThreshold: number;
    batchNumber?: string;
    expiryDate?: Date;
    vendorId?: mongoose.Types.ObjectId;
}

const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);

export default InventoryItem;
