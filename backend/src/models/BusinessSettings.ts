import mongoose from 'mongoose';

const categoryConfigSchema = new mongoose.Schema({
    name: { type: String, required: true },
    unit: { type: String, required: true },
}, { _id: false });

const businessSettingsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: 'EssenceFlow',
    },
    caption: {
        type: String,
    },
    email: {
        type: String,
    },
    logoUrl: {
        type: String,
    },
    categories: [categoryConfigSchema],
}, {
    timestamps: true,
});

export interface IBusinessSettings extends mongoose.Document {
    name: string;
    caption?: string;
    email?: string;
    logoUrl?: string;
    categories: { name: string; unit: string }[];
}

const BusinessSettings = mongoose.model<IBusinessSettings>('BusinessSettings', businessSettingsSchema);

export default BusinessSettings;
