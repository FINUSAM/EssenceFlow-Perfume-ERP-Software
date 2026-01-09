import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
        required: true,
    },
    totalSpent: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

export interface ICustomer extends mongoose.Document {
    name: string;
    email?: string;
    phone: string;
    totalSpent: number;
}

const Customer = mongoose.model<ICustomer>('Customer', customerSchema);

export default Customer;
