import { Request, Response } from 'express';
import Customer from '../models/Customer';

// @desc    Get all customers
// @route   GET /api/v1/customers
// @access  Private
export const getCustomers = async (req: Request, res: Response) => {
    try {
        const customers = await Customer.find({});
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new customer
// @route   POST /api/v1/customers
// @access  Private
export const createCustomer = async (req: Request, res: Response) => {
    try {
        const { name, email, phone } = req.body;

        const customer = new Customer({
            name,
            email,
            phone,
        });

        const createdCustomer = await customer.save();
        res.status(201).json(createdCustomer);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
};

// @desc    Update a customer
// @route   PATCH /api/v1/customers/:id
// @access  Private
export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (customer) {
            customer.name = req.body.name || customer.name;
            customer.email = req.body.email || customer.email;
            customer.phone = req.body.phone || customer.phone;

            const updatedCustomer = await customer.save();
            res.json(updatedCustomer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
};

// @desc    Delete a customer
// @route   DELETE /api/v1/customers/:id
// @access  Private
export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer) {
            await customer.deleteOne();
            res.json({ message: 'Customer removed' });
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
