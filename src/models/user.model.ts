import { Schema, model, Document } from 'mongoose';

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    PROVIDER = 'PROVIDER',
    ADMIN = 'ADMIN',
}

export enum AuthProvider {
    EMAIL = 'email',
    GOOGLE = 'google',
    FACEBOOK = 'facebook',
}

export interface IUser extends Document {
    fullName: string;
    email: string;
    passwordHash?: string; // Optional for OAuth users
    role: UserRole;
    isEmailVerified: boolean;
    authProvider: AuthProvider;
    
    // Google OAuth specific fields
    googleId?: string; // Google's 'sub' - unique, immutable identifier
    googleEmail?: string; // Email from Google (can differ from primary email)
    googlePicture?: string; // Profile picture URL from Google
    
    // Security & Audit fields
    roleAssignedAt: Date; // When role was first assigned
    roleAssignedBy?: string; // 'system' | 'admin' | userId
    isProviderApproved?: boolean; // For PROVIDER role approval workflow
    providerApprovedAt?: Date;
    providerApprovedBy?: string; // Admin userId who approved
    
    // Account status
    isActive: boolean;
    isSuspended: boolean;
    suspendedReason?: string;
    suspendedAt?: Date;
    
    // Additional fields
    phone?: string;
    profilePic?: string;
    
    // Timestamps
    lastLoginAt?: Date;
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
            select: false, // Don't return password by default
            // Not required - OAuth users won't have passwords
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.CUSTOMER,
            index: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        authProvider: {
            type: String,
            enum: Object.values(AuthProvider),
            default: AuthProvider.EMAIL,
            required: true,
        },
        
        // Google OAuth fields
        googleId: {
            type: String,
            sparse: true, // Allows null but enforces uniqueness when present
            unique: true,
            index: true,
        },
        googleEmail: {
            type: String,
            lowercase: true,
            trim: true,
        },
        googlePicture: {
            type: String,
        },
        
        // Role management & audit
        roleAssignedAt: {
            type: Date,
            default: Date.now,
        },
        roleAssignedBy: {
            type: String,
            default: 'system',
        },
        isProviderApproved: {
            type: Boolean,
            default: false,
        },
        providerApprovedAt: {
            type: Date,
        },
        providerApprovedBy: {
            type: String,
        },
        
        // Account status
        isActive: {
            type: Boolean,
            default: true,
        },
        isSuspended: {
            type: Boolean,
            default: false,
        },
        suspendedReason: {
            type: String,
        },
        suspendedAt: {
            type: Date,
        },
        
        phone: {
            type: String,
            trim: true,
        },
        profilePic: {
            type: String,
            default: '',
        },
        
        lastLoginAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient Google user lookups
userSchema.index({ googleId: 1, authProvider: 1 });

// Index for role-based queries
userSchema.index({ role: 1, isActive: 1 });

// Validation: Email users must have password
userSchema.pre('save', function (next: any) {
    if (this.authProvider === AuthProvider.EMAIL && !this.passwordHash && this.isNew) {
        return next(new Error('Password is required for email authentication'));
    }
    next();
});

// Validation: Google users must have googleId
userSchema.pre('save', function (next: any) {
    if (this.authProvider === AuthProvider.GOOGLE && !this.googleId && this.isNew) {
        return next(new Error('Google ID is required for Google authentication'));
    }
    next();
});

export const User = model<IUser>('User', userSchema);
