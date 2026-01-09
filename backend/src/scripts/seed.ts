import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { connectDB } from '../config/db';

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();

        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@essenceflow.com' });
        if (adminExists) {
            console.log('Admin user already exists');
            process.exit();
        }

        await User.create({
            name: 'Admin User',
            email: 'admin@essenceflow.com',
            password: 'password123', // Will be hashed by pre-save hook
            role: 'admin',
        });

        console.log('Admin user created: admin@essenceflow.com / password123');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
