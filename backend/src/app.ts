import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import vendorRoutes from './routes/vendorRoutes';
import productRoutes from './routes/productRoutes';
import saleRoutes from './routes/saleRoutes';
import customerRoutes from './routes/customerRoutes';
import expenseRoutes from './routes/expenseRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import wastageRoutes from './routes/wastageRoutes';
import settingsRoutes from './routes/settingsRoutes';
import backupRoutes from './routes/backupRoutes';
import { connectDB } from './config/db';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' })); // Increase API limit for large backups

// Database Connection Middleware for Serverless
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection failed:', error);
        next(error);
    }
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/wastage', wastageRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/backup', backupRoutes);

// Basic Health Check
app.get('/', (req, res) => {
    res.json({ message: 'EssenceFlow API is running', timestamp: new Date().toISOString() });
});

export default app;
