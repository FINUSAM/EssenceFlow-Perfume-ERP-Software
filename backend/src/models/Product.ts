import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
    inventoryItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        description: 'Amount in ml (for oils) or count (items)',
    },
}, { _id: false });

const productSchema = new mongoose.Schema({
    sku: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    ingredients: [ingredientSchema], // Raw materials (Oils)
    packaging: [ingredientSchema],   // Packaging (Bottles, Boxes, etc.) - reusing schema structure
    sellingPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    totalCost: {
        type: Number,
        required: true,
        default: 0,
        description: 'Calculated cost of goods sold based on current material costs',
    },
    currentStock: {
        type: Number,
        required: true,
        default: 0,
    },
}, {
    timestamps: true,
});

export interface IProduct extends mongoose.Document {
    sku: string;
    name: string;
    ingredients: { inventoryItemId: mongoose.Types.ObjectId; amount: number }[];
    packaging: { inventoryItemId: mongoose.Types.ObjectId; amount: number }[];
    sellingPrice: number;
    totalCost: number;
    currentStock: number;
}

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
