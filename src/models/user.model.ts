import { Schema, model, Document } from 'mongoose';

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    PROVIDER = 'PROVIDER',
    ADMIN = 'ADMIN',
}

export interface IUser extends Document {
    fullName: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    isEmailVerified: boolean;
    authProvider: 'email' | 'google' | 'facebook';
    phone?: string;
    profilePic?: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        passwordHash: {
            type: String,
            required: [true, 'Password is required'],
            select: false, // Don't return password by default
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.CUSTOMER,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        authProvider: {
            type: String,
            enum: ['email', 'google', 'facebook'],
            default: 'email',
        },
        phone: {
            type: String,
            trim: true,
        },
        profilePic: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

export const User = model<IUser>('User', userSchema);
