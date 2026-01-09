import { Request, Response } from 'express';
import Vendor from '../models/Vendor';

// @desc    Get all vendors
// @route   GET /api/v1/vendors
// @access  Private
export const getVendors = async (req: Request, res: Response) => {
    try {
        const vendors = await Vendor.find({});
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new vendor
// @route   POST /api/v1/vendors
// @access  Private
export const createVendor = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, leadTime } = req.body;

        const vendor = new Vendor({
            name,
            email,
            phone,
            leadTime,
        });

        const createdVendor = await vendor.save();
        res.status(201).json(createdVendor);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
};

// @desc    Update a vendor
// @route   PATCH /api/v1/vendors/:id
// @access  Private
export const updateVendor = async (req: Request, res: Response) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (vendor) {
            vendor.name = req.body.name || vendor.name;
            vendor.email = req.body.email || vendor.email;
            vendor.phone = req.body.phone || vendor.phone;
            if (req.body.leadTime !== undefined) vendor.leadTime = req.body.leadTime;

            const updatedVendor = await vendor.save();
            res.json(updatedVendor);
        } else {
            res.status(404).json({ message: 'Vendor not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
};

// @desc    Delete a vendor
// @route   DELETE /api/v1/vendors/:id
// @access  Private
export const deleteVendor = async (req: Request, res: Response) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (vendor) {
            await vendor.deleteOne();
            res.json({ message: 'Vendor removed' });
        } else {
            res.status(404).json({ message: 'Vendor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
