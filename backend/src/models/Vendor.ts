import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    leadTime: {
        type: Number,
        required: true,
        default: 0,
        description: 'Standard delivery cycle in days',
    },
}, {
    timestamps: true,
});

export interface IVendor extends mongoose.Document {
    name: string;
    email: string;
    phone: string;
    leadTime: number;
}

const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);

export default Vendor;
