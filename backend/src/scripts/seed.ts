import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { connectDB } from '../config/db';

dotenv.config();

// --- CONFIGURATION ---
const NEW_USER_NAME = 'Imran';
const NEW_USER_EMAIL = 'imraninjas@gmail.com';
const NEW_USER_PASSWORD = 'BilalInjas';
const NEW_USER_ROLE = 'admin';
// ---------------------

const seedData = async () => {
    try {
        await connectDB();

        // Check if user with this email already exists
        const userExists = await User.findOne({ email: NEW_USER_EMAIL });

        if (userExists) {
            console.log(`User already exists: ${NEW_USER_EMAIL}`);
            process.exit();
        }

        await User.create({
            name: NEW_USER_NAME,
            email: NEW_USER_EMAIL,
            password: NEW_USER_PASSWORD, // Will be hashed by pre-save hook
            role: NEW_USER_ROLE,
        });

        console.log(`User created successfully:`);
        console.log(`Email: ${NEW_USER_EMAIL}`);
        console.log(`Password: ${NEW_USER_PASSWORD}`);

        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
