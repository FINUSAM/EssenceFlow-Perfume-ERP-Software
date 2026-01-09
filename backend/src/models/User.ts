import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'staff'],
        default: 'admin',
    },
}, {
    timestamps: true,
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

export interface IUser extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'manager' | 'staff';
    matchPassword(enteredPassword: string): Promise<boolean>;
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const User = mongoose.model<IUser>('User', userSchema);

export default User;
