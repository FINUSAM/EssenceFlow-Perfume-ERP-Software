import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
    inventoryItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    costPerUnit: {
        type: Number,
        required: true,
    },
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
    },
    items: [purchaseItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    referenceNumber: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

export interface IPurchaseItem {
    inventoryItemId: mongoose.Types.ObjectId;
    quantity: number;
    costPerUnit: number;
}

export interface IPurchase extends mongoose.Document {
    vendorId: mongoose.Types.ObjectId;
    items: IPurchaseItem[];
    totalAmount: number;
    date: Date;
    referenceNumber: string;
    createdAt: Date;
    updatedAt: Date;
}

const Purchase = mongoose.model<IPurchase>('Purchase', purchaseSchema);

export default Purchase;
