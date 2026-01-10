import { Request, Response } from 'express';
import BusinessSettings from '../models/BusinessSettings';

// @desc    Get business settings
// @route   GET /api/v1/settings
// @access  Private
export const getSettings = async (req: Request, res: Response) => {
    try {
        let settings = await BusinessSettings.findOne();

        if (!settings) {
            // Create default settings if none exist
            settings = await BusinessSettings.create({
                name: 'EssenceFlow',
                categories: [
                    { name: 'OIL', unit: 'ml' },
                    { name: 'BOTTLE', unit: 'pcs' },
                    { name: 'CAP', unit: 'pcs' },
                    { name: 'BOX', unit: 'pcs' },
                ]
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update business settings
// @route   PUT /api/v1/settings
// @access  Private (Admin only usually, but open to auth users for now)
export const updateSettings = async (req: Request, res: Response) => {
    try {
        let settings = await BusinessSettings.findOne();

        if (!settings) {
            settings = new BusinessSettings(req.body);
        } else {
            settings.name = req.body.name || settings.name;
            settings.caption = req.body.caption || settings.caption;
            settings.email = req.body.email || settings.email;
            settings.logoUrl = req.body.logoUrl || settings.logoUrl;
            settings.categories = req.body.categories || settings.categories;
        }

        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
};
