import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    unitPrice: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
}, { _id: false });

const saleSchema = new mongoose.Schema({
    receiptNumber: {
        type: String,
        required: true,
        unique: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false, // Walk-ins allowed
    },
    items: [saleItemSchema],
    subtotal: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['COMPLETED', 'VOIDED'],
        default: 'COMPLETED',
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

export interface ISale extends mongoose.Document {
    receiptNumber: string;
    customerId?: mongoose.Types.ObjectId;
    items: { productId: mongoose.Types.ObjectId; quantity: number; unitPrice: number; total: number }[];
    subtotal: number;
    discount: number;
    total: number;
    status: 'COMPLETED' | 'VOIDED';
    date: Date;
}

const Sale = mongoose.model<ISale>('Sale', saleSchema);

export default Sale;
